const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
app.use(express.static('public'));





const MONGODB_URI = process.env.MONGODB_URI || 
    'mongodb+srv://garyhu17_db_user:LpA4uoaUAWdoE90X@cluster0.sopfye6.mongodb.net/student_management?retryWrites=true&w=majority';
mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('成功連接到 MongoDB Atlas');
})
.catch((err) => {
    console.error('MongoDB 連接失敗:', err.message);
});
const db = mongoose.connection;




db.on('error', (err) => {
    console.error('資料庫連線錯誤:', err);
});
db.once('open', function () {
    console.log('資料庫連線已開啟');
});






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

const Student = mongoose.model('Student', studentSchema);









app.get('/students', async (req, res) => {
    try {
        const students = await Student.find().sort({ createdDate: -1 });
        console.log(`取得 ${students.length} 筆學生資料`);
        res.json(students);
    } catch (err) {
        console.error('取得學生資料失敗:', err);
        res.status(500).json({ message: '取得學生資料失敗', error: err.message });
    }
});




app.get('/students/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ message: '找不到該學生' });
        }
        
        res.json(student);
    } catch (err) {
        console.error('取得學生資料失敗:', err);
        res.status(500).json({ message: '取得學生資料失敗', error: err.message });
    }
});





app.post('/students', async (req, res) => {
    try {
        const { name, age, grade } = req.body;
        
        console.log('收到新增學生請求:', { name, age, grade });
        
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
        
        console.log('成功新增學生:', newStudent);
        res.status(201).json(newStudent);
    } catch (err) {
        console.error('新增學生失敗:', err);
        res.status(400).json({ 
            message: '新增學生失敗', 
            error: err.message 
        });
    }
});





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
        
        console.log('✏️ 成功更新學生:', updatedStudent);
        res.json(updatedStudent);
    } catch (err) {
        console.error('更新學生資料失敗:', err);
        res.status(500).json({ 
            message: '更新學生資料失敗', 
            error: err.message 
        });
    }
});





app.delete('/students/:id', async (req, res) => {
    try {
        const deletedStudent = await Student.findByIdAndDelete(req.params.id);
        
        if (!deletedStudent) {
            return res.status(404).json({ message: '找不到該學生' });
        }
        
        console.log('成功刪除學生:', deletedStudent);
        res.json({ 
            message: '成功刪除學生', 
            student: deletedStudent 
        });
    } catch (err) {
        console.error('刪除學生失敗:', err);
        res.status(500).json({ 
            message: '刪除學生失敗', 
            error: err.message 
        });
    }
});




app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});




app.use((req, res) => {
    res.status(404).json({ message: '找不到該路由' });
});




app.listen(PORT, () => {
    console.log(`伺服器運行於 http://localhost:${PORT}`);
    console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
});