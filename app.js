const state = {
  screen: "pay",
  payInput: "",
  addInput: "",
  balanceCents: Number(localStorage.getItem("zolo_balance_cents") || 0),
  selectedPresetCents: 0,
  sendMode: "Pay",
  selectedRecipient: null
};

const $ = (id) => document.getElementById(id);
const els = {
  payScreen: $("payScreen"),
  balanceScreen: $("balanceScreen"),
  activityScreen: $("activityScreen"),
  bottomTabs: $("bottomTabs"),
  payAmount: $("payAmount"),
  balanceAmount: $("balanceAmount"),
  savingsAmount: $("savingsAmount"),
  mainKeypad: $("mainKeypad"),
  addKeypad: $("addKeypad"),
  addSheet: $("addSheet"),
  addMoneyBtn: $("addMoneyBtn"),
  sheetAddBtn: $("sheetAddBtn"),
  customAmountBtn: $("customAmountBtn"),
  sheetBalanceLabel: $("sheetBalanceLabel"),
  customBalanceLabel: $("customBalanceLabel"),
  customAddScreen: $("customAddScreen"),
  customAddAmount: $("customAddAmount"),
  customAddBtn: $("customAddBtn"),
  closeCustomAdd: $("closeCustomAdd"),
  sendSheet: $("sendSheet"),
  sendTitle: $("sendTitle"),
  closeSendSheet: $("closeSendSheet"),
  recipientList: $("recipientList"),
  recipientSearch: $("recipientSearch"),
  noteScreen: $("noteScreen"),
  noteBack: $("noteBack"),
  noteLineOne: $("noteLineOne"),
  noteRecipientLine: $("noteRecipientLine"),
  noteInput: $("noteInput"),
  reviewBtn: $("reviewBtn"),
  successOverlay: $("successOverlay"),
  successText: $("successText"),
  activityList: $("activityList"),
  peopleStrip: $("peopleStrip"),
  activityBadge: $("activityBadge"),
  profileScreen: $("profileScreen")
};

const keypadKeys = ["1","2","3","4","5","6","7","8","9",".","0","‹"];
const phoneKeys = [
  ["1", ""], ["2", "ABC"], ["3", "DEF"],
  ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
  ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
  [".", ""], ["0", ""], ["⌫", ""]
];

const contacts = [
  { name: "jasmine turner", tag: "$jakaybria", color: "#f151c8", initial: "J" },
  { name: "Eunice Thomas", tag: "$EThomas66", color: "photo", initial: "E" },
  { name: "Rampage Hair Studio", tag: "$RampageHairStudio", color: "#ffe04b", initial: "R", business: true },
  { name: "Mo Farah", tag: "$RulaTha4th", color: "#d8d8d8", initial: "M" },
  { name: "ADADON", tag: "$aadadon1", color: "#061039", initial: "A" },
  { name: "Bam Davidson", tag: "$850bam", color: "#2a2a2a", initial: "B" }
];

let activity = JSON.parse(localStorage.getItem("zolo_activity") || "null") || [
  { type: "withdraw", title: "Withdrawal", sub: "Zolo Game debit", day: "Monday", amount: "$15.20" },
  { type: "person", title: "jasmine turner", sub: "gas", day: "Monday", amount: "$14", like: true, color: "#f151c8", initial: "J" },
  { type: "person", title: "Eunice Thomas", sub: "g", day: "Sunday", amount: "$1.20", like: true, color: "photo", initial: "E" },
  { type: "withdraw", title: "Withdrawal", sub: "Zolo Game debit", day: "Sunday", amount: "$9" },
  { type: "person", title: "Rampage Hair Studio", sub: "Gas", day: "Sunday", amount: "$9", like: true, color: "#ffe04b", initial: "R", business: true }
];

function boot() {
  buildHomeKeypad();
  buildPhoneKeypad();
  renderPeople();
  renderContacts();
  renderActivity();
  bindEvents();
  updateMoneyUI();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
}

function bindEvents() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchScreen(btn.dataset.tab));
  });

  ["openProfile", "openProfile2", "openProfile3", "openProfile4"].forEach(id => $(id)?.addEventListener("click", openProfile));
  $("closeProfile")?.addEventListener("click", closeProfile);

  els.addMoneyBtn.addEventListener("click", openAddSheet);
  $("withdrawBtn").addEventListener("click", () => fakeDone("Coming soon"));
  els.addSheet.addEventListener("click", (event) => {
    if (event.target.classList.contains("dimmed-backdrop")) closeAddSheet();
  });

  document.querySelectorAll("[data-preset]").forEach(button => {
    button.addEventListener("click", () => selectPreset(button));
  });

  els.customAmountBtn.addEventListener("click", () => {
    closeAddSheet();
    setTimeout(openCustomAdd, 120);
  });

  els.sheetAddBtn.addEventListener("click", () => {
    if (state.selectedPresetCents > 0) addBalance(state.selectedPresetCents);
  });

  els.customAddBtn.addEventListener("click", () => {
    const cents = inputToCents(state.addInput);
    if (cents > 0) addBalance(cents, true);
  });

  els.closeCustomAdd.addEventListener("click", closeCustomAdd);
  $("payBtn").addEventListener("click", () => openSend("Pay"));
  $("requestBtn").addEventListener("click", () => openSend("Request"));
  $("poolBtn").addEventListener("click", () => openSend("Pool"));
  els.closeSendSheet.addEventListener("click", closeSendSheet);
  els.sendSheet.addEventListener("click", (event) => {
    if (event.target.classList.contains("dimmed-backdrop")) closeSendSheet();
  });

  els.recipientSearch.addEventListener("input", () => renderContacts(els.recipientSearch.value));
  els.noteBack.addEventListener("click", () => {
    closeNote();
    setTimeout(() => els.sendSheet.classList.add("open"), 80);
  });
  els.noteInput.addEventListener("input", updateReviewButton);
  els.reviewBtn.addEventListener("click", finishSend);

  window.addEventListener("resize", fitAllMoney);
}

function buildHomeKeypad() {
  els.mainKeypad.innerHTML = "";
  keypadKeys.forEach(key => {
    const btn = document.createElement("button");
    btn.className = key === "‹" ? "key-btn back" : "key-btn";
    btn.type = "button";
    btn.textContent = key;
    btn.addEventListener("pointerdown", () => btn.classList.add("touching"));
    btn.addEventListener("pointerup", () => btn.classList.remove("touching"));
    btn.addEventListener("pointercancel", () => btn.classList.remove("touching"));
    btn.addEventListener("pointerleave", () => btn.classList.remove("touching"));
    btn.addEventListener("click", () => inputKey("pay", key));
    els.mainKeypad.appendChild(btn);
  });
}

function buildPhoneKeypad() {
  els.addKeypad.innerHTML = "";
  phoneKeys.forEach(([key, letters]) => {
    const btn = document.createElement("button");
    btn.className = key === "⌫" ? "phone-key back" : "phone-key";
    btn.type = "button";
    btn.innerHTML = key === "⌫" ? "⌫" : `${key}${letters ? `<span>${letters}</span>` : ""}`;
    btn.addEventListener("click", () => inputKey("add", key));
    els.addKeypad.appendChild(btn);
  });
}

function inputKey(target, key) {
  const prop = target === "pay" ? "payInput" : "addInput";
  if (key === "‹" || key === "⌫") state[prop] = state[prop].slice(0, -1);
  else if (key === ".") {
    if (!state[prop].includes(".")) state[prop] = state[prop] ? state[prop] + "." : "0.";
  } else {
    state[prop] = appendDigit(state[prop], key);
  }
  updateMoneyUI();
}

function appendDigit(current, digit) {
  if (current === "0") current = "";
  const next = current + digit;
  if (!/^\d{0,7}(\.\d{0,2})?$/.test(next)) return current;
  return next;
}

function inputToCents(input) {
  if (!input || input === ".") return 0;
  const [d = "0", c = ""] = input.split(".");
  const cents = Number(d || "0") * 100 + Number((c + "00").slice(0, 2));
  return Number.isFinite(cents) ? cents : 0;
}

function formatCents(cents) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function displayInput(input) {
  if (!input) return "$0";
  if (input.endsWith(".")) return "$" + input;
  return "$" + input;
}

function updateMoneyUI() {
  els.payAmount.textContent = displayInput(state.payInput);
  els.customAddAmount.textContent = displayInput(state.addInput);
  els.balanceAmount.textContent = formatCents(state.balanceCents);
  els.savingsAmount.textContent = formatCents(0);
  els.sheetBalanceLabel.textContent = `Game balance ${formatCents(state.balanceCents)}`;
  els.customBalanceLabel.textContent = `Game balance ${formatCents(state.balanceCents)}`;

  const addCents = inputToCents(state.addInput);
  els.customAddBtn.textContent = addCents > 0 ? "Add" : "Add";
  els.customAddBtn.disabled = addCents <= 0;
  els.customAddBtn.classList.toggle("enabled", addCents > 0);

  fitAllMoney();
}

function fitAllMoney() {
  [els.payAmount, els.balanceAmount, els.customAddAmount, els.savingsAmount].forEach(fitMoneyText);
}

function fitMoneyText(el) {
  if (!el || !el.parentElement) return;
  const parentWidth = el.parentElement.clientWidth - 8;
  const base = Number(el.dataset.baseSize || parseFloat(getComputedStyle(el).fontSize));
  if (!el.dataset.baseSize) el.dataset.baseSize = String(base);
  let size = base;
  el.style.fontSize = `${size}px`;
  while (el.scrollWidth > parentWidth && size > 32) {
    size -= 2;
    el.style.fontSize = `${size}px`;
  }
}

function switchScreen(screen) {
  state.screen = screen;
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("screen-active", s.dataset.screen === screen));
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === screen));
  fitAllMoney();
}

function openAddSheet() {
  state.selectedPresetCents = 0;
  document.querySelectorAll("[data-preset]").forEach(b => b.classList.remove("selected"));
  els.sheetAddBtn.disabled = true;
  els.sheetAddBtn.classList.remove("enabled");
  els.addSheet.classList.add("open");
}

function closeAddSheet() {
  els.addSheet.classList.remove("open");
}

function selectPreset(button) {
  document.querySelectorAll("[data-preset]").forEach(b => b.classList.remove("selected"));
  button.classList.add("selected");
  state.selectedPresetCents = Number(button.dataset.preset) * 100;
  els.sheetAddBtn.textContent = "Add";
  els.sheetAddBtn.disabled = false;
  els.sheetAddBtn.classList.add("enabled");
}

function openCustomAdd() {
  state.addInput = "";
  updateMoneyUI();
  els.customAddScreen.classList.add("open");
}

function closeCustomAdd() {
  els.customAddScreen.classList.remove("open");
}

function addBalance(cents, fromCustom = false) {
  if (cents <= 0) return;
  state.balanceCents += cents;
  localStorage.setItem("zolo_balance_cents", String(state.balanceCents));
  addActivity({
    type: "withdraw",
    title: "Add money",
    sub: "Zolo Game debit",
    day: "Today",
    amount: "+" + formatCents(cents)
  });
  closeAddSheet();
  if (fromCustom) closeCustomAdd();
  state.addInput = "";
  state.selectedPresetCents = 0;
  updateMoneyUI();
  showSuccess("Added", () => switchScreen("balance"));
}

function openSend(mode) {
  state.sendMode = mode;
  const amount = displayInput(state.payInput || "0");
  els.sendTitle.innerHTML = `${mode} ${amount} <span>to</span>`;
  els.recipientSearch.value = "";
  renderContacts();
  els.sendSheet.classList.add("open");
  setTimeout(() => els.recipientSearch.focus({ preventScroll: true }), 230);
}

function closeSendSheet() {
  els.sendSheet.classList.remove("open");
}

function renderContacts(query = "") {
  const q = query.trim().toLowerCase();
  const filtered = contacts.filter(c => !q || c.name.toLowerCase().includes(q) || c.tag.toLowerCase().includes(q));
  els.recipientList.innerHTML = filtered.map((c, index) => `
    <button class="recipient-row" data-contact-index="${contacts.indexOf(c)}">
      ${avatarHTML(c, "bubble")}
      <span><strong>${escapeHTML(c.name)}${c.business ? " 💼" : ""}</strong><em>${escapeHTML(c.tag)}</em></span>
    </button>
  `).join("");

  els.recipientList.querySelectorAll(".recipient-row").forEach(btn => {
    btn.addEventListener("click", () => selectRecipient(contacts[Number(btn.dataset.contactIndex)]));
  });
}

function selectRecipient(contact) {
  state.selectedRecipient = contact;
  closeSendSheet();
  const amount = displayInput(state.payInput || "0");
  const shortName = contact.name.split(" ")[0] + (contact.name.includes(" ") ? " t." : "");
  els.noteLineOne.innerHTML = `${state.sendMode} ${amount} <span>to</span>`;
  els.noteRecipientLine.innerHTML = `${avatarHTML(contact, "bubble")}<strong>${escapeHTML(shortName)}</strong><span>for</span>`;
  els.noteInput.value = "";
  updateReviewButton();
  setTimeout(() => {
    els.noteScreen.classList.add("open");
    setTimeout(() => els.noteInput.focus({ preventScroll: true }), 240);
  }, 80);
}

function closeNote() {
  els.noteScreen.classList.remove("open");
}

function updateReviewButton() {
  const ready = els.noteInput.value.trim().length > 0;
  els.reviewBtn.disabled = !ready;
  els.reviewBtn.classList.toggle("enabled", ready);
}

function finishSend() {
  const amount = displayInput(state.payInput || "0");
  const contact = state.selectedRecipient || contacts[0];
  addActivity({
    type: "person",
    title: contact.name,
    sub: els.noteInput.value.trim(),
    day: "Today",
    amount: amount,
    like: true,
    color: contact.color,
    initial: contact.initial,
    business: contact.business
  });
  closeNote();
  state.payInput = "";
  updateMoneyUI();
  showSuccess(state.sendMode === "Request" ? "Requested" : state.sendMode === "Pool" ? "Created" : "Sent", () => switchScreen("activity"));
}

function renderPeople() {
  const people = [{ name: "Get $500", plus: true }, ...contacts.slice(0, 5)];
  els.peopleStrip.innerHTML = people.map(p => `
    <button class="person-bubble">
      ${p.plus ? `<div class="bubble plus">+</div>` : avatarHTML(p, "bubble")}
      <span>${escapeHTML(p.name)}</span>
    </button>
  `).join("");
}

function renderActivity() {
  els.activityBadge.textContent = String(Math.min(activity.length, 9));
  localStorage.setItem("zolo_activity", JSON.stringify(activity));
  els.activityList.innerHTML = activity.map(item => {
    const avatar = item.type === "withdraw" ? `<div class="activity-avatar">$</div>` : avatarHTML(item, "activity-avatar");
    const amount = item.like ? `<div class="like-pill"><span class="heart-icon">♡</span>${escapeHTML(item.amount)}</div>` : `<div class="activity-amount">${escapeHTML(item.amount)}</div>`;
    return `
      <article class="activity-row">
        ${avatar}
        <div><h3>${escapeHTML(item.title)}${item.business ? " 💼" : ""}</h3><p>${escapeHTML(item.sub)}</p><small>${escapeHTML(item.day)}</small></div>
        ${amount}
      </article>
    `;
  }).join("");
}

function addActivity(item) {
  activity.unshift(item);
  activity = activity.slice(0, 30);
  renderActivity();
}

function avatarHTML(person, klass) {
  const bg = person.color === "photo" ? "linear-gradient(135deg,#9d8a73,#2c1717 50%,#111)" : person.color || "#2c97ff";
  const color = bg.includes("#061") || bg.includes("#2a") ? "#fff" : "#000";
  return `<div class="${klass}" style="background:${bg};color:${color}">${escapeHTML(person.initial || "M")}</div>`;
}

function openProfile() {
  els.profileScreen.classList.add("open");
}

function closeProfile() {
  els.profileScreen.classList.remove("open");
}

function fakeDone(text) {
  showSuccess(text, () => {});
}

function showSuccess(text, after) {
  els.successText.textContent = text;
  els.successOverlay.classList.add("show");
  setTimeout(() => {
    els.successOverlay.classList.remove("show");
    setTimeout(() => after && after(), 220);
  }, 1050);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

boot();
