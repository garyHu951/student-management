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
const MONGODB_URI = process.env.MONGODB_URI || 
    'mongodb+srv://garyhu17_db_user:LpA4uoaUAWdoE90X@cluster0.sopfye6.mongodb.net/student_management?retryWrites=true&w=majority';

// 連接到 MongoDB - 修正後的設定
mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,  // 連接超時時間
    socketTimeoutMS: 45000,          // Socket 超時時間
})
.then(() => {
    console.log('✅ 成功連接到 MongoDB Atlas');
})
.catch((err) => {
    console.error('❌ MongoDB 連接失敗:', err.message);
});

const db = mongoose.connection;

// 資料庫連線錯誤處理
db.on('error', (err) => {
    console.error('資料庫連線錯誤：', err);
});

// 資料庫連線成功
db.once('open', function () {
    console.log('✅ 資料庫連線已開啟');
});

// 定義 Student Schema
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
        
        if (!name || !age || !grade) {
            return res.status(400).json({ 
                message: '姓名、年齡和年級為必填欄位' 
            });
        }

        const newStudent = new Student({
            name,
            age: parseInt(age),
            grade
        });

        await newStudent.save();
        
        res.status(201).json(newStudent);
    } catch (err) {
        console.error('新增學生失敗：', err);
        res.status(400).json({ 
            message: '新增學生失敗', 
            error: err.message 
        });
    }
});

// PUT /students/:id - 更新學生資料
app.put('/students/:id', async (req, res) => {
    try {
        const { name, age, grade } = req.body;
        
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

// DELETE /students/:id - 刪除學生
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
    console.log(`🚀 伺服器運行於 http://localhost:${PORT}`);
});