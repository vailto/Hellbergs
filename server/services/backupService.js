const backupRepo = require('../repos/backupRepo');

async function exportBackup() {
  const data = await backupRepo.exportAll();
  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    data,
  };
}

module.exports = {
  exportBackup,
};
