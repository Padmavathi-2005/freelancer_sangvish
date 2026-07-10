import fs from 'fs';
import https from 'https';
import pool from '../config/db.js';

const file = fs.createWriteStream('./public/images/categories/sales.jpg');
https.get('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400&auto=format&fit=crop', (res) => {
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    pool.query('UPDATE categories SET category_image = $1 WHERE category_name = $2', ['public/images/categories/sales.jpg', 'Sales'])
      .then(() => {
        console.log('Sales updated');
        process.exit(0);
      });
  });
});
