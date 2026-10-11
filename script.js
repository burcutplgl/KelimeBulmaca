//!1.kısım: sabitler ve ekranı çizme
//alfabe
const TURKISH_ALPHABET="ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";

// klavye düzeni
const KEYBOARD_LAYOUT = [
  ["E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
  ["ENTER", "Z", "C", "V", "B", "N", "M", "Ö", "Ç", "BACKSPACE"],
];
//tuş renkleri için öncelik yeşil>sarı>gri
const STATUS_PRIORITY={correct:3, present:2, absent:1};

//oyun durumları(game state)

let targetList=[]; //gizli kelime havuzu (500+)
let validWordSet = new Set(); //geçerli tahmin havuzu (5000+)
let secretWord= ""; //rastgele seçilen gizli kelime
let currentRow =0; //oyuncunun bulunduğu satır (0-5)
let currentGuess =""; //mevcut satıra yazılan harfler
let isGameOver = false; //oyun bitti mi
let isRevealing= false //kutular dönüyor mu (klavyeyi kitle)
let keyState ={} // klavyedeki harflerin ulaştığı en yüksek renk
let guessesHistory=[];//paylaşım için satırların renk geçmişi


//dom element referansları
const boardElement =document.getElementById("board");
const keyboardElement =document.getElementById("keyboard");
const toastContainer =document.getElementById("toast-container");
const modalOverlay =document.getElementById("modal-overlay");
const modalIcon =document.getElementById("modal-icon");
const modalTitle =document.getElementById("modal-title");
const modalMessage =document.getElementById("modal-message");
const btnRestart =document.getElementById("btn-restart");

//oyun tahtasını (6x5) dinamik oluşturma
function createBoard(){
    //eskiden kalan bir içerik varsa temizle
    boardElement.innerHTML="";

     // 6 satır oluştur
  for (let r = 0; r < 6; r++) {
    const row = document.createElement("div");
    row.className = "board-row";

    // her satır içerisinden 5 kutu oluştur
    for (let c = 0; c < 5; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      row.appendChild(tile);
    }

    // satırı oyun tahtasına ekle
    boardElement.appendChild(row);
  }
}
//ekran klavyesini dinamik oluşturma
function createKeyboard(){
    //daha önceden ekrana basılan bir içerik varsa temizle
    keyboardElement.innerHTML="";

    //klavye satırlarını ekrana bass
    KEYBOARD_LAYOUT.forEach((rowKeys) => {
        //satır elementi oluştur
        const rowDiv=document.createElement("div");
        rowDiv.className ="keyboard-row";

        //satır içerisine her bir harf için buton oluştur
        rowKeys.forEach((key)=>{
            const button = document.createElement("button");
            button.className ="key";
            button.type="button";
            button.setAttribute("data-key",key);

                 if (key === "BACKSPACE") {
        button.textContent = "⌫";
        button.classList.add("delete-key");
      } else if (key === "ENTER") {
        button.textContent = "ENTER";
        button.classList.add("wide-key");
      } else {
        button.textContent = key;
      }

          //butonu satır elementi içerisine ekle
          rowDiv.appendChild(button);
        });

        //satırı ekrandaki klavye kısmına gönder
        keyboardElement.appendChild(rowDiv);

        
    });

}

//tahtayı ve klavyeyi ekrana çiz
createBoard();
createKeyboard();


//2.KISIM
// :Kelimeleri çekme ve harf girişleri
//ekrana bildirim gönderme
function showToast(message){
    //bildiirim elementi oluştur
const toast = document.createElement("div");
//sınııfı belirle
toast.className="toast";
//parametre olarak gelen mesajı bildirim içine yaz
toast.textContent=message;
//bildrimi ekrandaki bildirim containerine gönder
toastContainer.appendChild(toast);
// 2 saniye sonra elementi kaldır
setTimeout(() =>toast.remove(),2000); 
}

//Hatalı girişte satırı sallama
function shakeCurrentRow(){
    //kullanıcının bulunduğu satır elementine erişme
    const row  = boardElement.children[currentRow];
    //sallanma sınıfı
    row.classList.add("shake");
    //animayon bitince sınıfı kaldır
  setTimeout(() => row.classList.remove("shake"), 500);
}
//aktif satıra harf ekleme
function addLetter(letter){
    //5 harf yazıldıysa fonksiyonu durdur
    if(currentGuess.length >= 5) return;

//yeni harfi mevcut tahmine ekle
    currentGuess += letter;

//aktif satıra eriş
const row = boardElement.children[currentRow];

//aktif kutucuğa eriş
const tile = row.children[currentGuess.length - 1];
//aktif kutucuğa son yazılan harfi ekle
tile.textContent = letter;

// yazı yazılaan kutuya animasyon ver
tile.classList.add("active", "pop");

//animasyonu bir müddet sonra kaldır
setTimeout(() => tile.classList.remove("pop"), 120)
}


//aktif satırlardan harfi kaldır(delete)
    function deleteLetter(){
        if(currentGuess.length === 0) return;

        const row = boardElement.children[currentRow];
        const tile = row.children[currentGuess.length - 1];
        tile.textContent ="";
        tile.classList.remove("active");

        currentGuess = currentGuess.slice(0, -1);
}


// girişlerle ilgili fonksiyonlara yönlendir
function handleInput(key){
    //oyun bittiyse veya tahmin gösteriliyorsa fonksiyonu durdur
    if(isGameOver || isRevealing) return;

    if(key ==="ENTER"){
        submitGuess();
    }

    else if(key=== "BACKSPACE"){
        deleteLetter();
    }else{
        addLetter(key);
    }
}

//OLAY İZLEME
//fiziksel klavye olayı
window.addEventListener("keydown", (event) =>{
    //klavyeden basılan tuş
    const key = event.key;

    //basılan harf türkçede var mı kontrol et
    if(key === "ENTER"){
        handleInput("ENTER");
    }else if (key==="Backspace"){
        handleInput("BACKSPACE");
    }else{
        //büyük harfe çevir
    const upperLetter = key.toLocaleUpperCase("tr-TR");
    if(TURKISH_ALPHABET.includes(upperLetter)){
 
        //harfi ekrana yaz
       handleInput(upperLetter);
    }
    }
});

// sanal klavye olayı
keyboardElement.addEventListener("click", (event)=>{
    // tıklanılan yerdeki key sınıfına sahip elemente eriş
    const button = event.target.closest(".key");
//key sınıfına sahip elemeent yoksa fonksiyonu durdur
    if(!button) return;
//butonun key değerine eriş
    const key = button.getAttribute("data-key");
// harfi ekrana yaz
       handleInput(key);
});

//JSON DOSYASINDAN KELİMELERİ YÜKLEME
 async function loadWordList() {
    try{
        const response = await fetch(
             "https://raw.githubusercontent.com/furkanevin/wordle/refs/heads/master/kelimeler.json",
        );
        const data = await response.json();


   
  // Hedef Kelimler (Gizli kelime olarak seçilecek, bilenen kelimeler)
 targetList = data.hedefler.map((word) => word.toLocaleUpperCase("tr-TR"));

 // geçerli kelimeler (5k+ tüm türkçe kelimeler)
 validWordSet = new Set(data.kelimeler.map((word)=> word.toLocaleUpperCase("tr-TR")));
 

 //oyunu başlat
 initGame();
    }catch(error){
        console.error("Kelime listesi yüklenmedi");
    }
    }

//YENİ OYUN BAŞLATMA / DURUMU SIFIRLA
function initGame(){
     //gizli kelimeyi hedef kelimeler arasında rastgele bir şekilde seç
      const randomIndex = Math.floor(Math.random() * targetList.length);
      secretWord=targetList[randomIndex];

      // önceki oyundan değişen oyunları sıfırla
      currentRow =0;
      currentGuess ="";
      isGameOver = false;
      isRevealing = false;
     guessesHistory = [];
      keyState ={};

      //kutucuklardaki harfleri kaldır
      document.querySelectorAll(".tile").forEach((tile) =>{
        tile.textContent="";
        tile.className="tile";
      });
      //klavye tuş renklerini sıfırla
      document.querySelectorAll(".key").forEach((key) =>{
        key.classList.remove("correct","present", "absent");
      });
      //modalı kapat
      modalOverlay.classList.add("hidden");
}
// iki geçişli algoritme ve renklendirme
/*
  İki Geçişli Değerlendirme Algoritması (Two-Pass Algorithm)
 * 1. Geçiş: Tam doğru yerdeki (yeşil) harfler bulunur ve harf sayacı 1 düşülür.
 * 2. Geçiş: Kalanlardan sarı harfler bulunur; kelimede varsa sarı, yoksa gri işaretlenir.
 * Böylece "ELMAS" kelimesine "ALMAA" yazıldığında sadece gereken sayıda 'A' renk alır!
 */

//tahmini gizli kelimeyle karşılaştırıp her harf için correct/ present/absent dondüren fonksiyon
 function evaluateGuess(guess, secret) {
    //sonuç dizini  elemanla hepsi absent (gri) olarak başlatır
    const result = Array(5).fill("absent");
    //gizli kelimedeki harflerin kalan kullanım hakkıonı tutacak nesne (örn{a:2, p:1})
    const letterCounts ={};


 // Gizli kelimedi her harfin adetini sayıyoruz
  for (let i = 0; i < 5; i++) {
    const char = secret[i];
    letterCounts[char] = (letterCounts[char] || 0) + 1;
  }
  //1.geçiş: yeşili(doğru harf doğru yer) olanları bul
  for(let i=0; i<5; i++){
    //oyuncu tahmini ve gizli kelimenin index sırasındaki harfi aynıysa
    if(guess[i]=== secret[i]){
        //bu pozisyonu yeşil olarak işaretle
        result[i] ="correct";
        // bu harfin bir hakkını tükettik, sayacı düşür
        letterCounts[guess[i]]--;

    }
  }

  //2.geçiş: yeşil olmayanların arasından sarı olmayanları bulacam
  for(let i=0; i<5; i++){
    //zaten yeşil olan harfleri atla
    if(result[i]==="correct") continue;

    //kontrol ettiğimiz karakter
    const char = guess[i]

    //harf gizli kelimede var mı ve hala kullanılmamış hakkım kaldı mı,
    if(letterCounts[char]&& letterCounts[char]> 0){
        //sarı olarak işaretle
        result[i]="present";
        //bu harfin kullanım hakkını tükettik sayacı düşür
        letterCounts[char]--;
    }
  }
  //sonuç dizisini döndür(correct,absent,absent,absent,correct...)
  return result;
 }
 //Kutuları Sırayla Çeviren ve Boyayan Animasyon
 function paintRow(rowIndex, result, onComplete) {
  // yeni harf girdisi kitle
  isRevealing = true;
  //boyayacağımız kutucuklara eriş
   const row = boardElement.children[rowIndex];
  const tiles = Array.from(row.children);
  //kutucukların her biri için
  tiles.forEach((tile,index) => {
    //her kutuya 250ms geçikmeli dönme animasyonu ver
    setTimeout(() => {
        // dönme animasyonu ver
        tile.classList.add("flip");


        // kutunun tam 90 derece dik olduğu anda arka plan rengini ver
        setTimeout(()=>{
         tile.classList.add(result[index]);
        }, 250);

 // Son kutu döndükten sonra kilitleri aç ve sonraki adıma geç
 if(index === 4){
    setTimeout(()=>{
        isRevealing = false;
        onComplete();
    }, 500);
 }
    },250 * index);
  });
  }

  //ekran Klavyesindeki Tuşları Öncelik Kuralına Göre Boya (Yeşil > Sarı > Gri)
function updateKeyboard(guess, result) {
  for (let i = 0; i < 5; i++) {
    // tahmin kelimesindeki index sırasındaki harfe eriş
    const letter = guess[i];

    // harfin sonuç durumunu al
    const status = result[i];

    // öncelikli rengi belirlememek için harfin renk skorunu belirle
    const currenScore = STATUS_PRIORITY[keyState[letter]] || 0;

    // harfin yeni renk skoru
    const newScore = STATUS_PRIORITY[status];

    // yeni tahmin skoru önceki tahmnin skorundan daha büyükse rengi değiştir
    if (newScore > currenScore) {
      // tahmin edilen kelimedeki harflerin güncel renklerini belirle
      keyState[letter] = status;

      // boyanacak harfi ekrandan al
      const keyBtn = document.querySelector(`.key[data-key="${letter}"]`);

      if (keyBtn) {
        // önceki tahminden bir rengi varsa kaldır
        keyBtn.classList.remove("absent", "present", "correct");
        // yeni tahminde elde edilen rengi ver
        keyBtn.classList.add(status);
      }
    }
  }
}

//TAHMİNİ GÖNDERME
function submitGuess() {
  // 1. Kural: 5 harf yazılmış mı?
  if (currentGuess.length < 5) {
    shakeCurrentRow();
    showToast("Yetersiz harf!");
    return;
  }

  // 2. Kural: Oyuncunun kelimesi geçerli kelime listemizde var mı?
  if (!validWordSet.has(currentGuess)) {
    shakeCurrentRow();
    showToast("Kelime listede yok!");
    return;
  }

  // Tahmini değerlendir ve geçmişe kaydet
  const result = evaluateGuess(currentGuess, secretWord);
  guessesHistory.push(result);

  // Önce Kutuları boya sonra klavyeyi güncelle
  paintRow(currentRow, result, () => {
    updateKeyboard(currentGuess, result);

    // tahmin doğruysa oyunu bitir
    if (currentGuess === secretWord) {
      endGame(true);
    } else if (currentRow === 5) {
      endGame(false);
    } else {
      // sonraki satıra geç
      currentRow++;
      currentGuess = "";
    }
  });
}
 //Oyun Bitişi, Yeniden Dene

//  Kazanınca Çalışacak Konfeti Efekti
function triggerConfetti() {
  // konfeti renkleri
  const colors = ["#10b891", "#f59e0b", "#38bdf8", "#ec4899", "#8b5cf6"];

  // 50 konfeti oluştur
  for (let i = 0; i < 50; i++) {
    // konfeti elementi oluştur
    const confetti = document.createElement("div");
    // elemente css sınıfı tanımla
    confetti.className = "confetti-piece";
    // x ekseninde rastgele bir konuma hizala
    confetti.style.left = Math.random() * 100 + "vw";
    // rastgele bir renk ver
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    // minimum 1.5sn max 3.5sn'de düşme animasyonu ver
    confetti.style.animationDuration = Math.random() * 2 + 1.5 + "s";
    // max 0.2s daha geç başlama ihtimali ver
    confetti.style.animationDelay = Math.random() * 0.2 + "s";
    // konfetiyi ekrana gönder
    document.body.appendChild(confetti);
    // animasyon sonunda konfeti elementlerini DOM'dan kaldır
    setTimeout(() => confetti.remove(), 4000);
  }
}
//Oyun Sonu Kartını Açma
function endGame(isWin) {
  isGameOver = true;

  setTimeout(() => {
    modalOverlay.classList.remove("hidden");

    // kazandıysa
    if (isWin) {
      modalIcon.textContent = "🎉";
      modalTitle.textContent = "Tebrikler!";
      modalMessage.innerHTML = `Gizli kelimeyi <strong>${currentRow + 1}.</strong> denemede bildin!`;
      triggerConfetti();

    } else {
      modalIcon.textContent = "😔";
      modalTitle.textContent = "Oyun Bitti!";
      modalMessage.innerHTML = `Doğru kelime <strong>${secretWord}</strong>`;
    }
  }, 600);
}

//  Yeniden Oyna
btnRestart.addEventListener("click", () => {
  // oyunu yeniden başlatma fonksiyonu
  initGame();
  // bildirim gönder
  showToast("Yeni oyun başladı 🍀");
});


    //SONNNN: kelimeleri yükle ve oyunu başlat
 loadWordList();

 

