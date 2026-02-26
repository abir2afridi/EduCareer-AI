// Quick Firebase test - run this in browser console
// This will help verify Firebase is working correctly

// Test 1: Check if Firebase modules are loading
console.log('🔥 Testing Firebase Configuration...');

// Test 2: Check environment variables
const testEnvVars = () => {
  console.log('📋 Environment Variables:');
  console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
  console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing');
  console.log('VITE_FIREBASE_STORAGE_BUCKET:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing');
};

// Test 3: Check Firebase initialization
const testFirebaseInit = () => {
  try {
    // This should work if firebase.js is properly configured
    const { app } = require('./firebase.js');
    console.log('✅ Firebase app initialized:', app ? 'Success' : 'Failed');
    console.log('📱 Firebase project ID:', app?.options?.projectId);
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
  }
};

// Test 4: Check Firebase services
const testFirebaseServices = () => {
  try {
    const { auth, db, storage } = require('./firebase.js');
    console.log('🔐 Auth service:', auth ? '✅ Ready' : '❌ Failed');
    console.log('🗄️ Firestore service:', db ? '✅ Ready' : '❌ Failed');
    console.log('📁 Storage service:', storage ? '✅ Ready' : '❌ Failed');
  } catch (error) {
    console.error('❌ Firebase services test failed:', error.message);
  }
};

// Run all tests
console.log('🧪 Running Firebase Tests...');
testEnvVars();
testFirebaseInit();
testFirebaseServices();

console.log('🎉 Firebase test complete! Check the results above.');
