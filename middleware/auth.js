const jwt = require(`jsonwebtoken`);
 const JWT_SECRET = process.env.JWT_SECRET;

 function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'Akses ditolak, token tidak ditemukan' });
    }
    jwt.verify(token, JWT_SECRET, (err, decodedPayload) => {
        if (err) {
            return res.status(403).json({ error: 'Token tidak valid ' });
        }
        req.user = decodedPayload.user;//{Id, username, role}
        next();
    });
}

//Middleware Autorisasi (BARU)
function authorizeRole(role) {
    return (req, res) => {
        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Akses Dilarang: peran tidak memadai' });
        }
    };
}
module.exports = {authenticateToken,
                    authorizeRole};
