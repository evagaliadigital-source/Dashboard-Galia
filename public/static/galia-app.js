// ============================================
// GALIA APP - MÓDULO DE EXTENSIONES
// ============================================
// Este archivo extiende full-app.js con funcionalidad adicional
// TODAS las funciones principales están en full-app.js

console.log('📦 Módulo galia-app.js cargado');

// ============================================
// INITIALIZE (EJECUTAR AL FINAL DE TODO)
// ============================================
console.log('✅ Galia Digital - Todos los módulos cargados');

// Ejecutar inicialización después de que todos los scripts se hayan cargado
if (typeof initGaliaApp === 'function') {
  initGaliaApp();
} else {
  console.error('❌ Error: initGaliaApp no está definida');
}
