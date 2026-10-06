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
const radiusPercent = 33;

const wheel = document.getElementById("wheel");
const wheelStage = document.getElementById("wheelStage");
const wheelItems = document.getElementById("wheelItems");
const goBtn = document.getElementById("goBtn");
const resultModal = document.getElementById("resultModal");
const editModal = document.getElementById("editModal");
const resultEmoji = document.getElementById("resultEmoji");
const resultName = document.getElementById("resultName");
const foodInputs = document.getElementById("foodInputs");
const toast = document.getElementById("toast");

renderWheelItems();
drawWheel();

// 仅保留页面下方的“编辑菜单”入口；右上角设置入口已取消。
goBtn.addEventListener("click", spin);
document.getElementById("againBtn").addEventListener("click", () => {
  resultModal.classList.add("hidden");
  setTimeout(spin, 150);
});
document.getElementById("homeBtn").addEventListener("click", () => {
  resultModal.classList.add("hidden");
});
document.getElementById("editMenuBtn").addEventListener("click", openEditor);
document.getElementById("closeEditBtn").addEventListener("click", closeEditor);
document.getElementById("saveBtn").addEventListener("click", saveEditor);

function loadFoods() {
  try {
    const saved = localStorage.getItem("foodRouletteFoods");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 6) {
        return parsed.map((item, i) => ({
          name: String(item.name || DEFAULT_FOODS[i].name),
          emoji: String(item.emoji || DEFAULT_FOODS[i].emoji)
        }));
      }
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
    "#ffe6ef",
    "#eee2ff",
    "#ffe7ca",
    "#dff5e8",
    "#dcecff",
    "#ffe0ec"
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
  }

  // 中心圆由真实按钮覆盖，这里只保留白色内圈视觉。
  ctx.beginPath();
  ctx.arc(center, center, 58, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,.22)";
  ctx.fill();
}

function renderWheelItems() {
  wheelItems.innerHTML = "";
  foods.forEach((food, index) => {
    const item = document.createElement("div");
    item.className = "wheel-item";
    item.dataset.index = index;

    const icon = document.createElement("span");
    icon.className = "food-icon";
    icon.textContent = food.emoji || "🍽️";

    const name = document.createElement("span");
    name.className = "food-name";
    name.textContent = food.name;

    item.append(icon, name);
    wheelItems.appendChild(item);
  });

  positionWheelItems();
}

function positionWheelItems() {
  const size = wheelStage.clientWidth;
  const center = size / 2;
  const radius = size * 0.33;
  const sliceDeg = 360 / foods.length;

  [...wheelItems.children].forEach((item, index) => {
    const angle = (-90 + index * sliceDeg) * Math.PI / 180;
    item.style.left = `${center + Math.cos(angle) * radius}px`;
    item.style.top = `${center + Math.sin(angle) * radius}px`;
    item.style.transform = `translate(-50%, -50%) rotate(0deg)`;
  });
}

function updateItemUpright(rotationDeg) {
  [...wheelItems.children].forEach(item => {
    item.style.transform = `translate(-50%, -50%) rotate(${-rotationDeg}deg)`;
  });
}

function spin() {
  if (isSpinning) return;

  isSpinning = true;
  goBtn.disabled = true;

  const winnerIndex = Math.floor(Math.random() * foods.length);
  const sliceDeg = 360 / foods.length;
  const winnerCenterDeg = winnerIndex * sliceDeg;
  const desiredExtra = 360 - winnerCenterDeg;
  const extraTurns = 5 + Math.floor(Math.random() * 2);
  const targetRotation = currentRotation + extraTurns * 360 + desiredExtra;

  currentRotation = targetRotation;
  wheelStage.style.transform = `rotate(${currentRotation}deg)`;

  // 转盘本体会旋转；文字和图标同时做完全相反的旋转，因此始终保持正向。
  [...wheelItems.children].forEach(item => {
    item.animate([
      { transform: "translate(-50%, -50%) rotate(0deg)" },
      { transform: `translate(-50%, -50%) rotate(${-targetRotation}deg)` }
    ], {
      duration: 5150,
      easing: "cubic-bezier(.12,.72,.16,1)",
      fill: "forwards"
    });
  });

  setTimeout(() => {
    isSpinning = false;
    goBtn.disabled = false;
    updateItemUpright(currentRotation);
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

    const iconInput = document.createElement("input");
    iconInput.className = "food-input icon-input";
    iconInput.value = food.emoji;
    iconInput.maxLength = 4;
    iconInput.dataset.index = index;
    iconInput.dataset.type = "emoji";
    iconInput.placeholder = "🍜";
    iconInput.setAttribute("aria-label", `第${index + 1}个图标`);

    const input = document.createElement("input");
    input.className = "food-input";
    input.value = food.name;
    input.maxLength = 12;
    input.dataset.index = index;
    input.dataset.type = "name";
    input.setAttribute("aria-label", `第${index + 1}个食物`);

    const remove = document.createElement("button");
    remove.className = "remove-btn";
    remove.textContent = "×";
    remove.type = "button";
    remove.title = "清空文字";
    remove.addEventListener("click", () => {
      input.value = "";
      input.focus();
    });

    row.append(number, iconInput, input, remove);
    foodInputs.appendChild(row);
  });
}

function saveEditor() {
  const rows = [...document.querySelectorAll(".food-row")];

  foods = rows.map((row, index) => {
    const iconInput = row.querySelector('[data-type="emoji"]');
    const nameInput = row.querySelector('[data-type="name"]');
    return {
      name: nameInput.value.trim() || DEFAULT_FOODS[index].name,
      emoji: iconInput.value.trim() || DEFAULT_FOODS[index].emoji
    };
  });

  saveFoods();
  renderWheelItems();
  drawWheel();
  closeEditor();

  toast.textContent = "保存成功！";
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 1500);
}

window.addEventListener("resize", () => {
  drawWheel();
  positionWheelItems();
  if (!isSpinning) updateItemUpright(currentRotation);
});
