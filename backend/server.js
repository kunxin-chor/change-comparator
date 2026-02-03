require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const axios = require('axios');
const Diff = require('diff');
const { getDb, connectToMongo } = require('./src/db');
const { buildChangesetsFromRepo, syncChangeset, parseRepoUrl } = require('./src/github');
const { ObjectId } = require('mongodb');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.redirect('/changeset/list');
});

app.get('/changeset/details/:id', async (req, res) => {
  const { id } = req.params;
  const { pair, v1, v2, file } = req.query;
  const tokenFromQuery = (req.query.token || '').trim();

  try {
    const db = getDb();
    const collection = db.collection('changesets');

    const doc = await collection.findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return res.status(404).send('Changeset not found');
    }

    // Store token per changeset id in session so user doesn't need to re-enter.
    if (!req.session.githubTokens) req.session.githubTokens = {};
    if (tokenFromQuery) {
      req.session.githubTokens[id] = tokenFromQuery;
    }
    const token = tokenFromQuery || req.session.githubTokens[id] || '';

    const changesets = doc.changesets || [];

    // Adjacent pair selection: pair=n means compare changesets[n] vs changesets[n+1]
    // Fallback: allow v1/v2 for back-compat.
    let idx1;
    let idx2;
    if (pair !== undefined) {
      const p = parseInt(pair, 10);
      idx1 = Number.isFinite(p) ? p : 0;
      idx2 = idx1 + 1;
    } else {
      idx1 = parseInt(v1, 10) || 0;
      idx2 = parseInt(v2, 10) || (changesets.length > 1 ? 1 : 0);
    }

    // Clamp to valid adjacent indices
    idx1 = Math.max(0, Math.min(idx1, Math.max(0, changesets.length - 2)));
    idx2 = Math.max(idx1 + 1, Math.min(idx2, Math.max(1, changesets.length - 1)));

    const cs1 = changesets[idx1];
    const cs2 = changesets[idx2];

    // Get all files from both versions
    const allFilesSet = new Set();
    if (cs1) cs1.files.forEach(f => allFilesSet.add(f.path));
    if (cs2) cs2.files.forEach(f => allFilesSet.add(f.path));
    const allFiles = Array.from(allFilesSet).sort();

    // Determine which files have changes between v1 and v2.
    // First, try cache stored on the changeset document.
    // If cache miss, call GitHub compare API and store the result back to MongoDB.
    let changedFileIds = [];
    const compareCacheKey = cs1?.sha && cs2?.sha ? `${cs1.sha}_${cs2.sha}` : null;
    const cached = compareCacheKey ? doc.compareCache?.[compareCacheKey] : null;
    if (cached && Array.isArray(cached.changedFileIds)) {
      changedFileIds = cached.changedFileIds;
    } else {
      try {
        const parsed = parseRepoUrl(doc.repoUrl);
        if (parsed && cs1?.sha && cs2?.sha) {
          const compareUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/compare/${cs1.sha}...${cs2.sha}`;
          const compareResp = await axios.get(compareUrl, {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              ...(token ? { Authorization: `token ${token}` } : {})
            }
          });
          const files = Array.isArray(compareResp.data?.files) ? compareResp.data.files : [];
          changedFileIds = files
            .map((f) => (f?.filename ? `/${f.filename}` : null))
            .filter(Boolean);

          if (compareCacheKey) {
            await collection.updateOne(
              { _id: new ObjectId(id) },
              {
                $set: {
                  [`compareCache.${compareCacheKey}`]: {
                    changedFileIds,
                    fetchedAt: new Date(),
                    from: `${cs1.sha}...${cs2.sha}`
                  }
                }
              }
            );
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    const selectedFile = file || (allFiles.length > 0 ? allFiles[0] : null);
    
    let diffLines = [];
    let content1 = '';
    let content2 = '';
    let comments1 = {};
    let comments2 = {};

    if (selectedFile) {
      const f1 = cs1 ? cs1.files.find(f => f.path === selectedFile) : null;
      const f2 = cs2 ? cs2.files.find(f => f.path === selectedFile) : null;
      
      comments1 = f1?.comments || {};
      comments2 = f2?.comments || {};

      if (f1?.url) {
        try {
          const resp = await axios.get(f1.url, {
            headers: token ? { Authorization: `token ${token}` } : undefined
          });
          content1 = resp.data;
        } catch (e) { content1 = `Error loading: ${e.message}`; }
      }
      if (f2?.url) {
        try {
          const resp = await axios.get(f2.url, {
            headers: token ? { Authorization: `token ${token}` } : undefined
          });
          content2 = resp.data;
        } catch (e) { content2 = `Error loading: ${e.message}`; }
      }

      if (content1 || content2) {
        const diff = Diff.diffLines(content1, content2);
        let line1 = 1;
        let line2 = 1;

        diff.forEach(part => {
          const lines = part.value.split('\n');
          if (lines[lines.length - 1] === '') lines.pop();

          lines.forEach(text => {
            if (part.added) {
              diffLines.push({ type: 'added', text, line2: line2++, comment: comments2[line2-1] });
            } else if (part.removed) {
              diffLines.push({ type: 'removed', text, line1: line1++, comment: comments1[line1-1] });
            } else {
              diffLines.push({ type: 'normal', text, line1: line1++, line2: line2++, comment2: comments2[line2-1], comment1: comments1[line1-1] });
            }
          });
        });
      }
    }

    res.render('changeset_details', { 
      item: doc, 
      v1: idx1, 
      v2: idx2, 
      pairIndex: idx1,
      token,
      selectedFile, 
      allFiles, 
      changedFileIds,
      diffLines,
      error: null 
    });
  } catch (err) {
    res.status(500).send(err && err.message ? err.message : String(err));
  }
});

app.post('/changeset/:id/comment', async (req, res) => {
  const { id } = req.params;
  const { versionIndex, filePath, lineNumber, text } = req.body;
  const pairFromBody = req.body.pair;
  const tokenFromBody = (req.body.token || '').trim();

  try {
    const db = getDb();
    const collection = db.collection('changesets');
    const doc = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!doc) return res.status(404).send('Not found');

    // UI submits version number (v1/v2), not array index.
    // Convert version number -> array index (version starts at 1).
    const versionNumber = parseInt(versionIndex, 10);
    const vIdxRaw = Number.isFinite(versionNumber) ? versionNumber - 1 : 0;
    const maxIdx = Array.isArray(doc.changesets) ? doc.changesets.length - 1 : 0;
    const vIdx = Math.max(0, Math.min(vIdxRaw, maxIdx));
    const line = parseInt(lineNumber, 10);

    const updateQuery = {};
    updateQuery[`changesets.${vIdx}.files.$[file].comments.${line}`] = text;

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateQuery },
      { arrayFilters: [{ "file.path": filePath }] }
    );

    // Persist token for future requests
    if (!req.session.githubTokens) req.session.githubTokens = {};
    if (tokenFromBody) {
      req.session.githubTokens[id] = tokenFromBody;
    }

    const q = new URLSearchParams();
    if (pairFromBody !== undefined && pairFromBody !== '') {
      q.set('pair', pairFromBody);
    } else {
      q.set('v1', req.body.v1 || 0);
      q.set('v2', req.body.v2 || 1);
    }
    q.set('file', filePath);
    if (tokenFromBody) q.set('token', tokenFromBody);

    res.redirect(`/changeset/details/${id}?${q.toString()}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/changeset/create', (req, res) => {
  res.render('changeset_create', {
    defaults: {
      name: '',
      repoUrl: '',
      branch: 'main',
      token: '',
      commitCount: 4
    },
    error: null,
    result: null
  });
});

app.post('/changeset/create', async (req, res) => {
  const name = (req.body.name || '').trim();
  const repoUrl = (req.body.repoUrl || '').trim();
  const branch = (req.body.branch || 'main').trim();
  const token = (req.body.token || '').trim();
  const commitCountRaw = req.body.commitCount;
  const commitCount = Math.max(2, Math.min(20, parseInt(commitCountRaw, 10) || 4));

  const defaults = { name, repoUrl, branch, token, commitCount };

  if (!name || !repoUrl) {
    return res.status(400).render('changeset_create', {
      defaults,
      error: 'Please provide both a changeset name and a GitHub repo URL.',
      result: null
    });
  }

  try {
    const changesets = await buildChangesetsFromRepo({ repoUrl, branch, token, commitCount });

    const doc = {
      name,
      repoUrl,
      branch,
      createdAt: new Date(),
      lastSyncedAt: new Date(),
      changesets
    };

    const db = getDb();
    const collection = db.collection('changesets');
    const insertResult = await collection.insertOne(doc);

    return res.render('changeset_create', {
      defaults,
      error: null,
      result: {
        insertedId: insertResult.insertedId,
        versions: changesets.length,
        totalFiles: changesets.reduce((acc, cs) => acc + (cs.files?.length || 0), 0)
      }
    });
  } catch (err) {
    return res.status(500).render('changeset_create', {
      defaults,
      error: err && err.message ? err.message : String(err),
      result: null
    });
  }
});

app.get('/changeset/list', async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection('changesets');
    const docs = await collection
      .find({})
      .sort({ createdAt: -1 })
      .project({ name: 1, repoUrl: 1, branch: 1, createdAt: 1, lastSyncedAt: 1, changesets: 1 })
      .toArray();

    const items = docs.map((d) => ({
      _id: d._id,
      name: d.name,
      repoUrl: d.repoUrl,
      branch: d.branch,
      createdAt: d.createdAt,
      lastSyncedAt: d.lastSyncedAt,
      versions: Array.isArray(d.changesets) ? d.changesets.length : 0,
      totalFiles: Array.isArray(d.changesets)
        ? d.changesets.reduce((acc, cs) => acc + (cs.files?.length || 0), 0)
        : 0
    }));

    res.render('changeset_list', { items });
  } catch (err) {
    res.status(500).send(err && err.message ? err.message : String(err));
  }
});

app.get('/api/changesets', async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection('changesets');
    const docs = await collection
      .find({})
      .sort({ createdAt: -1 })
      .project({ name: 1, repoUrl: 1, branch: 1, createdAt: 1, lastSyncedAt: 1, changesets: 1 })
      .toArray();

    const items = docs.map((d) => ({
      _id: d._id.toString(),
      name: d.name,
      repoUrl: d.repoUrl,
      branch: d.branch,
      createdAt: d.createdAt,
      lastSyncedAt: d.lastSyncedAt,
      versions: Array.isArray(d.changesets) ? d.changesets.length : 0
    }));

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
});

app.get('/api/changesets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    const collection = db.collection('changesets');

    const doc = await collection.findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return res.status(404).json({ error: 'Changeset not found' });
    }

    res.json({
      ...doc,
      _id: doc._id.toString()
    });
  } catch (err) {
    res.status(500).json({ error: err && err.message ? err.message : String(err) });
  }
});

async function handleSync(req, res) {
  const { id } = req.params;
  const { token } = req.body;

  try {
    const db = getDb();
    const collection = db.collection('changesets');

    const doc = await collection.findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return res.status(404).send('Changeset not found');
    }

    const updatedChangesets = await syncChangeset({
      repoUrl: doc.repoUrl,
      branch: doc.branch,
      token,
      existingChangesets: doc.changesets
    });

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { changesets: updatedChangesets, lastSyncedAt: new Date() } }
    );

    res.redirect(`/changeset/details/${id}`);
  } catch (err) {
    console.error('Update failed:', err);
    res.status(500).send(err.message);
  }
}

app.post('/changeset/:id/sync', handleSync);
app.post('/changeset/:id/update', handleSync);

const port = parseInt(process.env.PORT || '3001', 10);

connectToMongo()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start backend:', err);
    process.exit(1);
  });
