// =============================================
// Firebase Configuration (CDN compat mode)
// =============================================
// Para ativar login social (Google/Facebook), substitua os valores abaixo
// pelas credenciais reais do seu projeto Firebase.
// Console: https://console.firebase.google.com

const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};

// Inicializar Firebase (só se os SDKs estiverem carregados)
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
}
