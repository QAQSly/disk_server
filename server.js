const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mime_db = require('mime-db');
const mime = require('mime-types');
const app = express();

let fileList = [];

// 获取 MIME 类型
function getMimeType(extension) {
  const mimeType = mime_db[extension];
  if (mimeType) {
    return mimeType;
  }
  return 'application/octet-stream'; // 默认 MIME 类型
}


// 扫描文件
const scanFiles = () => {
  const uploadsPath = path.join(__dirname, 'uploads');
  fs.readdirSync(uploadsPath).forEach(file => {
    const filePath = path.join(uploadsPath, file);
    const extension = path.extname(file).substring(1);
    const mimeType = mime.contentType(extension);
    const stats = fs.statSync(filePath);
    fileList.push({
      name: file,
      path: `/uploads/${file}`,
      size: stats.size,
      mimetype: mimeType,
      uploadDate: stats.mtime.toISOString()
    });
  });
};
scanFiles();

// 设置 multer 存储配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 上传路由
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    fileList.push({
        name: req.file.fieldname,
        path: `/uploads/${req.file.fieldname}`,
        size: req.file.size,
        mimetype:  req.file.mimetype,
        uploadDate: new Date().toISOString(),
    });

    res.status(200).send('File uploaded successfully.');
});

// 获取文件列表
app.get('/files', (req, res) => {
    res.json(fileList);
})

// 下载路由
app.get('/download/:filename', (req, res) => {
    const file = req.params.filename;
    // 确保文件路径正确，并且文件存在
    const filePath = path.join(__dirname, 'uploads', file);
    res.download(filePath, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            return res.status(500).send('Error downloading file.');
        }
    });
});

// 确保 uploads 目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

app.listen(3000, () => {
    console.log("Server started on port 3000");
});