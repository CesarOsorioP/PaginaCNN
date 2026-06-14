const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

// Load env vars
dotenv.config();

// Workaround: force Node's DNS resolver to use a public DNS server for SRV lookups
// This can fix `querySrv ECONNREFUSED` errors on some networks where the default
// resolver is blocked or misconfigured.
const dns = require('dns');
try {
    dns.setServers(['8.8.8.8']);
    console.log('DNS servers set to:', dns.getServers());
} catch (err) {
    console.warn('Could not set DNS servers:', err.message);
}

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumentar límite para heatmaps grandes
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static folder for uploads
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));
console.log(`📁 Serviendo archivos estáticos desde: ${uploadsPath}`);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/studies', require('./routes/study.routes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
