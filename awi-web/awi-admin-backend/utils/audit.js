const db = require('../db');

function logAction(username, action, details = ''){
    try{
        db.prepare(
            'INSERT INTO audit_log (username, action, details) VALUES (?, ?, ?)'
        ).run(username, action, details)
    }catch(err){
        console.error('Audit log hiba:', err.message);
    }
}

module.exports = { logAction };