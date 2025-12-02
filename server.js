const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// MongoDB 連接設定
// 本地端連接
// const MONGODB_URI = 'mongodb://localhost:27017/student_management';

// 雲端 Atlas 連接（請替換成你自己的連接字串）
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://garyhu17_db_user:LpA4uoaUAWdoE90X@cluster0.sopfye6.mongodb.net/?appName=Cluster0';

// 連接到 MongoDB
mongoose.connect(MONGODB_URI);
const db = mongoose.connection;

// 資料庫連線錯誤處理
db.on('error', console.error.bind(console, '資料庫連線失敗！'));

// 資料庫連線成功
db.once('open', function () {
    console.log('成功連接到資料庫...');
});

// 定義 Student Schema（資料格式）
const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, '姓名為必填欄位'],
        trim: true
    },
    age: {
        type: Number,
        required: [true, '年齡為必填欄位'],
        min: [0, '年齡不能小於 0']
    },
    grade: {
        type: String,
        required: [true, '年級為必填欄位'],
        trim: true
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
});

// 建立 Student Model
const Student = mongoose.model('Student', studentSchema);

// ==================== API 路由 ====================

// GET /students - 取得所有學生資料
app.get('/students', async (req, res) => {
    try {
        // 找出所有學生資料，按建立日期排序（新到舊）
        const students = await Student.find().sort({ createdDate: -1 });
        res.json(students);
    } catch (err) {
        console.error('取得學生資料失敗：', err);
        res.status(500).json({ message: '取得學生資料失敗', error: err.message });
    }
});

// GET /students/:id - 取得單一學生資料
app.get('/students/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ message: '找不到該學生' });
        }
        
        res.json(student);
    } catch (err) {
        console.error('取得學生資料失敗：', err);
        res.status(500).json({ message: '取得學生資料失敗', error: err.message });
    }
});

// POST /students - 新增學生
app.post('/students', async (req, res) => {
    try {
        const { name, age, grade } = req.body;
        
        // 驗證必填欄位
        if (!name || !age || !grade) {
            return res.status(400).json({ 
                message: '姓名、年齡和年級為必填欄位' 
            });
        }

        // 建立新學生
        const newStudent = new Student({
            name,
            age: parseInt(age),
            grade
        });

        // 儲存到資料庫
        await newStudent.save();
        
        // 回傳 201 Created 狀態碼和新增的資料
        res.status(201).json(newStudent);
    } catch (err) {
        console.error('新增學生失敗：', err);
        res.status(400).json({ 
            message: '新增學生失敗', 
            error: err.message 
        });
    }
});

// PUT /students/:id - 更新學生資料（Bonus）
app.put('/students/:id', async (req, res) => {
    try {
        const { name, age, grade } = req.body;
        
        // 使用 findByIdAndUpdate 更新資料
        // { new: true } 會回傳更新後的資料
        // { runValidators: true } 會執行 Schema 驗證
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            { name, age: parseInt(age), grade },
            { new: true, runValidators: true }
        );
        
        if (!updatedStudent) {
            return res.status(404).json({ message: '找不到該學生' });
        }
        
        res.json(updatedStudent);
    } catch (err) {
        console.error('更新學生資料失敗：', err);
        res.status(500).json({ 
            message: '更新學生資料失敗', 
            error: err.message 
        });
    }
});

// DELETE /students/:id - 刪除學生（Bonus）
app.delete('/students/:id', async (req, res) => {
    try {
        const deletedStudent = await Student.findByIdAndDelete(req.params.id);
        
        if (!deletedStudent) {
            return res.status(404).json({ message: '找不到該學生' });
        }
        
        res.json({ 
            message: '成功刪除學生', 
            student: deletedStudent 
        });
    } catch (err) {
        console.error('刪除學生失敗：', err);
        res.status(500).json({ 
            message: '刪除學生失敗', 
            error: err.message 
        });
    }
});

// 404 處理
app.use((req, res) => {
    res.status(404).json({ message: '找不到該路由' });
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`伺服器運行於 http://localhost:${PORT}`);
});