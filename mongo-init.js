// This script runs automatically on first container initialization
// It creates an application-scoped user for the 'arm' database

db = db.getSiblingDB('arm');

db.createUser({
  user: 'appuser',
  pwd: 'apppass',
  roles: [
    { role: 'readWrite', db: 'arm' }
  ]
});


