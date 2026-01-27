require('dotenv').config();

const express = require('express');
const path = require('path');

const { getDb, connectToMongo } = require('./src/db');
const { buildChangesetsFromRepo } = require('./src/github');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.redirect('/changeset/list');
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
      .project({ name: 1, repoUrl: 1, branch: 1, createdAt: 1, changesets: 1 })
      .toArray();

    const items = docs.map((d) => ({
      _id: d._id,
      name: d.name,
      repoUrl: d.repoUrl,
      branch: d.branch,
      createdAt: d.createdAt,
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
