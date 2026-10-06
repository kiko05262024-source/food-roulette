const DEFAULT_FOODS = [
  { name: "拉面", emoji: "🍜" },
  { name: "寿司", emoji: "🍣" },
  { name: "烤肉", emoji: "🥩" },
  { name: "火锅", emoji: "🍲" },
  { name: "汉堡", emoji: "🍔" },
  { name: "饺子", emoji: "🥟" }
];

let foods = loadFoods();
let currentRotation = 0;
let isSpinning = false;

const wheel = document.getElementById("wheel");
const goBtn = document.getElementById("goBtn");
const resultModal = document.getElementById("resultModal");
const editModal = document.getElementById("editModal");
const resultEmoji = document.getElementById("resultEmoji");
const resultName = document.getElementById("resultName");
const foodInputs = document.getElementById("foodInputs");
const toast = document.getElementById("toast");

drawWheel();

goBtn.addEventListener("click", spin);
document.getElementById("againBtn").addEventListener("click", () => {
  resultModal.classList.add("hidden");
  setTimeout(spin, 150);
});
document.getElementById("homeBtn").addEventListener("click", () => {
  resultModal.classList.add("hidden");
});
document.getElementById("editBtn").addEventListener("click", openEditor);
document.getElementById("editMenuBtn").addEventListener("click", openEditor);
document.getElementById("closeEditBtn").addEventListener("click", closeEditor);
document.getElementById("saveBtn").addEventListener("click", saveEditor);

function loadFoods() {
  try {
    const saved = localStorage.getItem("foodRouletteFoods");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 6) return parsed;
    }
  } catch (error) {
    console.warn("无法读取本地菜单，使用默认菜单。", error);
  }
  return DEFAULT_FOODS.map(item => ({ ...item }));
}

function saveFoods() {
  localStorage.setItem("foodRouletteFoods", JSON.stringify(foods));
}

function drawWheel() {
  const ctx = wheel.getContext("2d");
  const size = wheel.width;
  const center = size / 2;
  const radius = size / 2 - 10;
  const slice = (Math.PI * 2) / foods.length;

  ctx.clearRect(0, 0, size, size);

  const colors = [
    "#ffd9e8",
    "#e9ddff",
    "#ffe5c4",
    "#dff5e7",
    "#d9eafa",
    "#ffe0ee"
  ];

  for (let i = 0; i < foods.length; i++) {
    const start = -Math.PI / 2 - slice / 2 + i * slice;
    const end = start + slice;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.stroke();

    const mid = start + slice / 2;
    const textRadius = radius * 0.66;
    const x = center + Math.cos(mid) * textRadius;
    const y = center + Math.sin(mid) * textRadius;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "58px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji";
    ctx.fillText(foods[i].emoji, x, y - 15);

    ctx.font = "bold 27px -apple-system, BlinkMacSystemFont, Noto Sans SC, sans-serif";
    ctx.fillStyle = "#75455f";
    ctx.fillText(foods[i].name, x, y + 34);
  }

  // 中心圆：视觉上的 GO 按钮
  ctx.beginPath();
  ctx.arc(center, center, 78, 0, Math.PI * 2);
  ctx.fillStyle = "#f36d9f";
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 12;
  ctx.stroke();
}

function spin() {
  if (isSpinning) return;

  isSpinning = true;
  goBtn.disabled = true;

  // 随机决定结果
  const winnerIndex = Math.floor(Math.random() * foods.length);
  const sliceDeg = 360 / foods.length;
  const winnerCenterDeg = winnerIndex * sliceDeg;

  // 指针在正上方；让目标扇区中心最终回到正上方
  const desiredExtra = 360 - winnerCenterDeg;
  const extraTurns = 5 + Math.floor(Math.random() * 2);
  const targetRotation = currentRotation + extraTurns * 360 + desiredExtra;

  currentRotation = targetRotation;
  wheel.style.transform = `rotate(${currentRotation}deg)`;

  setTimeout(() => {
    isSpinning = false;
    goBtn.disabled = false;
    showResult(winnerIndex);
  }, 5150);
}

function showResult(index) {
  resultEmoji.textContent = foods[index].emoji;
  resultName.textContent = `${foods[index].name}！`;
  resultModal.classList.remove("hidden");
}

function openEditor() {
  renderEditor();
  editModal.classList.remove("hidden");
}

function closeEditor() {
  editModal.classList.add("hidden");
}

function renderEditor() {
  foodInputs.innerHTML = "";

  foods.forEach((food, index) => {
    const row = document.createElement("div");
    row.className = "food-row";

    const number = document.createElement("div");
    number.className = "food-number";
    number.textContent = index + 1;

    const input = document.createElement("input");
    input.className = "food-input";
    input.value = food.name;
    input.maxLength = 12;
    input.dataset.index = index;
    input.setAttribute("aria-label", `第${index + 1}个食物`);

    const remove = document.createElement("button");
    remove.className = "remove-btn";
    remove.textContent = "×";
    remove.type = "button";
    remove.title = "清空";
    remove.addEventListener("click", () => {
      input.value = "";
      input.focus();
    });

    row.append(number, input, remove);
    foodInputs.appendChild(row);
  });
}

function saveEditor() {
  const inputs = [...document.querySelectorAll(".food-input")];

  foods = inputs.map((input, index) => {
    const name = input.value.trim() || DEFAULT_FOODS[index].name;
    return {
      name,
      emoji: DEFAULT_FOODS[index].emoji
    };
  });

  saveFoods();
  drawWheel();
  closeEditor();

  toast.textContent = "保存成功！";
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 1500);
}

// 屏幕大小变化时，canvas 保持清晰
window.addEventListener("resize", drawWheel);
