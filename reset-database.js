const fs = require('fs');
const path = require('path');

// Путь к базе данных
const dbPath = path.join(__dirname, 'data', 'vetformulab.db');

console.log('🚀 Сброс базы данных...');

// Проверяем существует ли база данных
if (fs.existsSync(dbPath)) {
  try {
    // Удаляем файл базы данных
    fs.unlinkSync(dbPath);
    console.log('✅ База данных успешно удалена!');
    console.log('🔄 При следующем запуске сервера база данных пересоздастся с 119 кормами');
    console.log('📋 Запустите сервер командой: npm start');
  } catch (error) {
    console.error('❌ Ошибка при удалении базы данных:', error.message);
  }
} else {
  console.log('ℹ️  База данных не найдена. При запуске сервера создастся новая база с 119 кормами');
  console.log('📋 Запустите сервер командой: npm start');
}

console.log('\n🎉 Готово! Теперь у вас будет 119 кормов в базе данных.'); 