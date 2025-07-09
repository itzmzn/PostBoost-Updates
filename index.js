// Express.js API for PostBoost App Update Info
const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.json());

const DATA_FILE = './updateData.json';

// Load or initialize update data
let appUpdateData = {
  appName: "PostBoost",
  packageName: "com.mazo.postboost",
  currentVersion: "v1.4.1",
  downloadLink: "https://mzn.is-a.dev/pb/download",
  updateAvailable: false,
  changelog: ""
};

if (fs.existsSync(DATA_FILE)) {
  const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    appUpdateData = JSON.parse(fileData);
  } catch (err) {
    console.error("Failed to parse update data. Using default.");
  }
} else {
  fs.writeFileSync(DATA_FILE, JSON.stringify(appUpdateData, null, 2));
}

// GET update info
app.get('/api/update', (req, res) => {
  res.json({ success: true, data: appUpdateData });
});

// POST update info (admin access only with simple token)
app.post('/api/update', (req, res) => {
  const token = req.headers['x-api-key'];
  const ADMIN_TOKEN = 'admin123'; // change this to a strong token

  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const { appName, packageName, currentVersion, downloadLink, updateAvailable, changelog } = req.body;

  if (currentVersion && typeof currentVersion !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid version format' });
  }

  appUpdateData = {
    ...appUpdateData,
    ...(appName && { appName }),
    ...(packageName && { packageName }),
    ...(currentVersion && { currentVersion }),
    ...(downloadLink && { downloadLink }),
    ...(updateAvailable !== undefined && { updateAvailable }),
    ...(changelog && { changelog })
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(appUpdateData, null, 2));

  res.json({ success: true, message: 'Update info modified successfully', data: appUpdateData });
});

// Version comparison endpoint (client can check if update needed)
app.get('/api/check', (req, res) => {
  const clientVersion = req.query.version;
  if (!clientVersion) return res.status(400).json({ success: false, message: 'Missing version query param' });

  const isOutdated = clientVersion !== appUpdateData.currentVersion;
  res.json({
    success: true,
    updateAvailable: isOutdated,
    latestVersion: appUpdateData.currentVersion,
    ...(isOutdated && { changelog: appUpdateData.changelog, downloadLink: appUpdateData.downloadLink })
  });
});

app.listen(port, () => {
  console.log(`PostBoost Update API running at http://localhost:${port}`);
});
    
