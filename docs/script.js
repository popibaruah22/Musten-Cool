const OWNER = "popibaruah22";

// ========== MAIN APP FUNCTIONS ==========

/* RECURSIVE FILE FETCH */
async function getAllFiles(owner, repo, path="") {
  const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
  if (!r.ok) return [];
  const d = await r.json();
  let f = [];
  for (let i of d) {
    if (i.type === "file") f.push(i);
    else f = f.concat(await getAllFiles(owner, repo, i.path));
  }
  return f;
}

async function loadSongs() {
  const s = document.getElementById("songs");
  const r = await fetch(`https://api.github.com/users/${OWNER}/repos`);
  const repos = await r.json();

  for (let repo of repos) {
    const files = await getAllFiles(OWNER, repo.name);
    const imgs = files.filter(f => /jpg|png|jpeg|webp/i.test(f.name));
    const auds = files.filter(f => /mp3|wav|m4a|ogg/i.test(f.name));

    const map = {};
    auds.forEach(a => {
      map[a.name.replace(/\..+$/, "").toLowerCase()] = a.download_url;
    });

    imgs.forEach(img => {
      const base = img.name.replace(/\..+$/, "");
      const key  = base.toLowerCase();

      if (!map[key]) return;

      s.innerHTML += `
      <div class="player">
        <img class="thumbnails" src="${img.download_url}"
          onclick="openPlayer('${img.download_url}','${map[key]}','${base}')">
        <center><h2 class="title">${base}</h2></center>
        <div class="divider"></div><p><br><br>
      </div>`;
    });
  }
}

loadSongs();

/* PLAYER FUNCTIONS */
const playerPage = document.getElementById("playerPage");
const playerAudio = document.getElementById("playerAudio");

function openPlayer(img, audio, title) {
  playerPage.style.display = "block";
  document.getElementById("main").style.display = "none";
  document.getElementById("playerImg").src = img;
  document.getElementById("playerTitle").textContent = title;
  playerAudio.src = audio;
  playerAudio.load();
}

function closePlayer() {
  playerAudio.pause();
  playerAudio.currentTime = 0;
  playerPage.style.display = "none";
  document.getElementById("main").style.display = "block";
}

function stopPlayer() {
  playerAudio.pause();
  playerAudio.currentTime = 0;
}

playerAudio.onloadedmetadata = () => {
  document.getElementById("seek").max = playerAudio.duration;
  document.getElementById("dur").textContent = fmt(playerAudio.duration);
};

playerAudio.ontimeupdate = () => {
  document.getElementById("seek").value = playerAudio.currentTime;
  document.getElementById("cur").textContent = fmt(playerAudio.currentTime);
};

function fmt(t) {
  return Math.floor(t / 60) + ":" +
    Math.floor(t % 60).toString().padStart(2, "0");
}

/* SEARCH FUNCTION */
function filterSongs() {
  const q = document.getElementById("search").value.toLowerCase();
  document.querySelectorAll(".player").forEach(p => {
    p.style.display =
      p.textContent.toLowerCase().includes(q) ? "block" : "none";
  });
}
document.getElementById("search").oninput = filterSongs;

/* INTERNET CONNECTION */
function updateConnectionStatus() {
  const loader = document.getElementById("loader");
  const main = document.getElementById("main");
  if (navigator.onLine) {
    loader.classList.add("hidden");
    main.style.display = "block";
  } else {
    loader.classList.remove("hidden");
    main.style.display = "none";
  }
}

/* PAGE NAVIGATION */
function next(){ 
  document.getElementById("main").style.display='none'; 
  document.getElementById("about").style.display='block'; 
}

function pre(){ 
  document.getElementById("about").style.display='none'; 
  document.getElementById("main").style.display='block'; 
}

/* ARTIST PAGE FUNCTIONS */
const songImageInput = document.getElementById("songImage");
const imagePreview = document.getElementById("imagePreview");
songImageInput.addEventListener("change", () => {
  const file = songImageInput.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = e => {
      imagePreview.innerHTML = `<img src="${e.target.result}" style="max-width:100%; border-radius:12px;">`;
    }
    reader.readAsDataURL(file);
  } else {
    imagePreview.innerHTML = "";
  }
});

const songAudioInput = document.getElementById("songAudio");
const audioPreview = document.getElementById("audioPreview");
songAudioInput.addEventListener("change", () => {
  const file = songAudioInput.files[0];
  if(file){
    audioPreview.textContent = `Selected Audio: ${file.name}`;
  } else {
    audioPreview.textContent = "";
  }
});

function openArtistPage(){
  document.getElementById("about").style.display = "none";
  document.getElementById("artistPage").style.display = "block";
}

function backToAbout(){
  document.getElementById("artistPage").style.display = "none";
  document.getElementById("about").style.display = "block";
}

function goPremium(){
  alert("Redirect to payment page / Razorpay checkout (no login/auth needed).");
}

async function submitSong(){
  const title = document.getElementById("songTitle").value;
  const imageFile = songImageInput.files[0];
  const audioFile = songAudioInput.files[0];

  if(!title || !imageFile || !audioFile){
    alert("All fields are required!");
    return;
  }

  const botToken = "8477369904:AAHA9Z1U7WHg_uJP-yMLoAt_fJ0KZCg57YA";
  const chatId = "-1002976779477";

  try{
    const submitBtn = document.querySelector('.submitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Uploading...";
    submitBtn.disabled = true;

    const formDataImg = new FormData();
    formDataImg.append("chat_id", chatId);
    formDataImg.append("photo", imageFile);
    formDataImg.append("caption", `🎵 New Song Submission\nTitle: ${title}`);

    const imgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: "POST",
      body: formDataImg
    });

    if(!imgResponse.ok) {
      const imgError = await imgResponse.json();
      throw new Error(`Image upload failed: ${imgError.description || 'Unknown error'}`);
    }

    const formDataAudio = new FormData();
    formDataAudio.append("chat_id", chatId);
    formDataAudio.append("audio", audioFile);
    formDataAudio.append("title", title);
    formDataAudio.append("performer", "Artist Submission");
    formDataAudio.append("caption", `🎵 Audio: ${title}`);

    const audioResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendAudio`, {
      method: "POST",
      body: formDataAudio
    });

    if(!audioResponse.ok) {
      const audioError = await audioResponse.json();
      throw new Error(`Audio upload failed: ${audioError.description || 'Unknown error'}`);
    }

    alert("✓ Song uploaded successfully!");
    
    document.getElementById("songTitle").value = "";
    songImageInput.value = "";
    songAudioInput.value = "";
    imagePreview.innerHTML = "";
    audioPreview.textContent = "";

  } catch(err){
    console.error("Upload error:", err);
    alert(`× Error: fail to upload`);
  } finally {
    const submitBtn = document.querySelector('.submitBtn');
    submitBtn.textContent = "Upload Song";
    submitBtn.disabled = false;
  }
}

// ========== POSTS PAGE FUNCTIONS ==========

// CONFIG
const BOT_TOKEN = "8466055115:AAEvCd-7ZGmFwt8O5LDvLiLu-_re2gT3IYI";
const CHAT_ID = "-1002976779477";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const GITHUB_USER = "sarajucheta69";

/* OPEN/CLOSE POSTS PAGE */
function openPostsPage() {
  document.getElementById("main").style.display = "none";
  document.getElementById("postsPage").style.display = "block";
  loadPostsGallery();
}

function closePostsPage() {
  document.getElementById("postsPage").style.display = "none";
  document.getElementById("main").style.display = "block";
}

/* POSTS MODAL FUNCTIONS */
function openPostsModal() {
  document.getElementById("postsModal").style.display = "flex";
}

function closePostsModal() {
  document.getElementById("postsModal").style.display = "none";
}

/* IMAGE PREVIEW FOR POSTS */
document.getElementById("postsImageInput").addEventListener("change", function(event) {
  const file = event.target.files[0];
  const preview = document.getElementById("postsImagePreview");
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.innerHTML = `<img src="${e.target.result}">`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = "";
  }
});

/* UPLOAD POST TO TELEGRAM */
async function uploadPostTelegram() {
  const img = document.getElementById("postsImageInput").files[0];
  const prompt = document.getElementById("postsPrompt").value.trim();
  if (!img || !prompt) return alert("Image + prompt required!");

  let safeName = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const extension = img.name.split('.').pop();
  safeName = `${safeName}.${extension}`;
  const renamedFile = new File([img], safeName, { type: img.type });

  const fd = new FormData();
  fd.append("chat_id", CHAT_ID);
  fd.append("photo", renamedFile);
  fd.append("caption", prompt);

  const uploadBtn = document.querySelector(".posts-upload-btn");
  const originalText = uploadBtn.textContent;

  try {
    uploadBtn.textContent = "Uploading...";
    uploadBtn.disabled = true;

    await fetch(`${TELEGRAM_API}/sendPhoto`, { method: "POST", body: fd });

    alert(" Uploaded!");
    document.getElementById("postsImageInput").value = "";
    document.getElementById("postsPrompt").value = "";
    document.getElementById("postsImagePreview").innerHTML = "";
    closePostsModal();
    loadPostsGallery();
  } catch(err) {
    console.error(err);
    alert(" Upload failed!");
  } finally {
    uploadBtn.textContent = originalText;
    uploadBtn.disabled = false;
  }
}

/* FETCH POSTS FROM GITHUB */
async function loadPostsGallery() {
  const gallery = document.getElementById("postsGallery");
  gallery.innerHTML = "";
  try {
    const reposRes = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos`);
    const repos = await reposRes.json();
    for (const repo of repos) {
      await fetchRepoFiles(GITHUB_USER, repo.name);
    }
  } catch(err) {
    console.error("Error loading posts:", err);
    gallery.innerHTML = "<p style='color:white;text-align:center;'>Error loading posts</p>";
  }
}

async function fetchRepoFiles(user, repoName, path = "") {
  const gallery = document.getElementById("postsGallery");
  try {
    const res = await fetch(`https://api.github.com/repos/${user}/${repoName}/contents/${path}`);
    const files = await res.json();
    if (!Array.isArray(files)) return;

    for (const file of files) {
      if (file.type === "dir") await fetchRepoFiles(user, repoName, file.path);
      else if (/\.(png|jpg|jpeg|gif)$/i.test(file.name)) {
        const prompt = file.name.replace(/\.(png|jpg|jpeg|gif)$/i,'').replace(/-/g,' ');
        const card = document.createElement("div");
        card.className = "post-card";
        card.innerHTML = `<img src="${file.download_url}" alt="${file.name}"><div>${prompt}</div>`;
        gallery.appendChild(card);
      }
    }
  } catch(err) {
    console.error("Error fetching repo files:", err);
  }
}

// ========== INITIALIZE ==========
updateConnectionStatus();
addEventListener("online", updateConnectionStatus);
addEventListener("offline", updateConnectionStatus);


/* ===== CONFIG ===== */
const TG_BOT_TOKEN = "8280799580:AAHgfc1uzQD8dvn4wFsP2fd-cR3NH7r4fPI";
const TG_CHAT_ID = "-1002976779477";
const GITHUB_OWNER = "bhaskar96-sk";

/* ===== ELEMENTS ===== */
const memberBtn = document.getElementById("member");
const closeBtn = document.getElementById("men-close");
const wide = document.getElementById("wide");
const purchaseBtn = document.getElementById("purchase");
const formBuy = document.getElementById("form-buy");
const closePurchase = document.getElementById("purchase-close");
const getBtn = document.getElementById("get");
const people = document.getElementById("people");

/* ===== SIDEBAR ===== */
memberBtn.addEventListener("click", () => {
  memberBtn.style.display = "none";
  closeBtn.style.display = "inline-block";
  wide.style.translate = "0";
  purchaseBtn.style.display = "none";
  document.querySelector("#heavy").style.display = "none";
});

closeBtn.addEventListener("click", () => {
  closeBtn.style.display = "none";
  memberBtn.style.display = "inline-block";
  wide.style.translate = "-200%";
  purchaseBtn.style.display = "block";
  document.querySelector("#heavy").style.display = "block";
});

/* ===== PURCHASE FORM ===== */
purchaseBtn.addEventListener("click", () => {
  formBuy.style.display = "block";
  purchaseBtn.style.display = "none";
});

closePurchase.addEventListener("click", () => {
  formBuy.style.display = "none";
  purchaseBtn.style.display = "inline-block";
});

/* ===== TELEGRAM ===== */
getBtn.addEventListener("click", e => {
  e.preventDefault();

  // ADD: button text handling
  const originalText = getBtn.textContent;
  getBtn.textContent = "Submitting...";

  // ADD: Internet check
  if (!navigator.onLine) {
    alert("No internet connection. Please try again later.");
    getBtn.textContent = originalText;
    return;
  }

  const f = document.querySelectorAll(".long")[0].value;
  const l = document.querySelectorAll(".long")[1].value;

  if(!f || !l){ 
    alert("Fill details"); 
    getBtn.textContent = originalText;
    return; 
  }
  
  fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,{
    method:"POST",
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      chat_id:TG_CHAT_ID,
      text:`New Badge Purchase\nName: ${f} ${l}\nMethod: Cash On School`
    })
  })
  .then(() => {
    alert("Details Submitted");
    getBtn.textContent = originalText;
  })
  .catch(() => {
    alert("Network error. Please check internet.");
    getBtn.textContent = originalText;
  });
});
/* ===== LOAD IMAGES FROM ALL OWNER REPOS ===== */
async function loadArtists(){
  people.innerHTML = "Loading images...";

  try{
    const repos = await fetch(
      `https://api.github.com/users/${GITHUB_OWNER}/repos`
    ).then(r=>r.json());

    people.innerHTML = "";

    for(const repo of repos){
      const files = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${repo.name}/contents`
      ).then(r=>r.json()).catch(()=>[]);

      if(!Array.isArray(files)) continue;

      files.forEach(file=>{
        if(
          file.type==="file" &&
          /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name)
        ){
          const div = document.createElement("div");
          div.style.margin="15px";
          div.innerHTML = `
            <img src="${file.download_url}"
              style="width:100px;height:100px;">
            <div>${file.name.replace(/\.[^/.]+$/, "")}</div>
          `;
          people.appendChild(div);
        }
      });
    }

    if(!people.innerHTML) people.innerHTML="There are no varified artist";

  }catch(err){
    people.innerHTML="No Internet...";
  }
}

loadArtists();

function goPremium() {
  document.querySelector("#badge-page").style.display = "block";
  document.querySelector("#about").style.display = "none";
}
function previous() {
  document.querySelector("#badge-page").style.display = "none";
  document.querySelector("#about").style.display = "block";
}
let m = document.querySelector("#master");
m.addEventListener("click", function() {
  document.querySelector("#badge-page").style.display = "none";
  document.querySelector("#P-Master-page").style.display = "block";
})

function preback() {
  document.querySelector("#badge-page").style.display = "block";
  document.querySelector("#P-Master-page").style.display = "none";
}

/*  CHANGE TOKEN AFTER TESTING */
const ROBOT_TOKEN = "8280799580:AAHgfc1uzQD8dvn4wFsP2fd-cR3NH7r4fPI";
const ROBOT_CHAT_ID = "8340525525";

function poste(e){
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName  = document.getElementById("lastName").value.trim();
  const btn = document.getElementById("bookBtn");

  if(!firstName || !lastName){
    alert("Please enter both first and last name");
    return;
  }

  btn.innerText = "Booking...";
  btn.disabled = true;

  const message =
`New Badge Booking
First Name: ${firstName}
Last Name: ${lastName}`;

  fetch(`https://api.telegram.org/bot${ROBOT_TOKEN}/sendMessage`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      chat_id: ROBOT_CHAT_ID,
      text: message
    })
  })
  .then(res => res.json())
  .then(data => {
    if(data.ok){
      btn.innerText = "Booked";
      alert("Booking sent successfully!");
    }else{
      throw new Error("Telegram error");
    }
  })
  .catch(() => {
    btn.innerText = "Book to Buy";
    btn.disabled = false;
    alert("Failed to send. Check internet.");
  });
}

let xx = document.querySelector("#mccall");
xx.addEventListener("click", function (){
  xx.textContent = "9101479635";
});
