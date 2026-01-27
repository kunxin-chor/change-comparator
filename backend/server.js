require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const { getDb, connectToMongo } = require('./src/db');
const { buildChangesetsFromRepo, syncChangeset } = require('./src/github');
const { ObjectId } = require('mongodb');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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

  try {
    const db = getDb();
    const collection = db.collection('changesets');

    const doc = await collection.findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return res.status(404).send('Changeset not found');
    }

    res.render('changeset_details', { item: doc, error: null });
  } catch (err) {
    res.status(500).send(err && err.message ? err.message : String(err));
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
