const state = {
  currentBalanceCents: 0,
  payInput: "",
  customAddInput: "",
  selectedPresetCents: 0,
  activeTab: "pay",
  flowMode: "Pay",
  selectedPerson: null,
  hiddenBalance: false,
  transactions: []
};

const people = [
  { name: "jasmine turner", short: "jasmine t.", handle: "@jakaybria", avatar: "J", tone: "pink" },
  { name: "Eunice Thomas", short: "Eunice T.", handle: "@EThomas66", avatar: "", tone: "photo" },
  { name: "Rampage Hair Studio", short: "Rampage", handle: "@RampageHairStudio", avatar: "R", tone: "yellow", business: true },
  { name: "Mo Farah", short: "Mo F.", handle: "@RulaTha4th", avatar: "", tone: "grayphoto" },
  { name: "ADADON", short: "ADADON", handle: "@aadadon1", avatar: "A", tone: "blue" },
  { name: "Bam Davidson", short: "Bam D.", handle: "@850bam", avatar: "B", tone: "photo" }
];

const initialTransactions = [
  { title: "Withdrawal", subtitle: "Zolo Bank\nMonday", amount: "$15.20", tone: "green", kind: "plain" },
  { title: "jasmine turner", subtitle: "gas\nMonday", amount: "$14", tone: "pink", kind: "like" },
  { title: "Eunice Thomas", subtitle: "g\nSunday", amount: "$1.20", tone: "photo", kind: "like" },
  { title: "Withdrawal", subtitle: "Zolo Bank\nSunday", amount: "$9", tone: "green", kind: "plain" },
  { title: "Rampage Hair Studio", subtitle: "Gas\nSunday", amount: "$9", tone: "yellow", kind: "like" },
  { title: "Withdrawal", subtitle: "Zolo Bank\nSunday", amount: "$26", tone: "green", kind: "plain" }
];

const els = {
  app: document.getElementById("app"),
  payScreen: document.getElementById("payScreen"),
  balanceScreen: document.getElementById("balanceScreen"),
  activityScreen: document.getElementById("activityScreen"),
  payAmount: document.getElementById("payAmount"),
  balanceAmount: document.getElementById("balanceAmount"),
  addPresetBalance: document.getElementById("addPresetBalance"),
  customAddBalance: document.getElementById("customAddBalance"),
  customAddAmount: document.getElementById("customAddAmount"),
  payKeypad: document.getElementById("payKeypad"),
  customAddKeypad: document.getElementById("customAddKeypad"),
  addMoneyBtn: document.getElementById("addMoneyBtn"),
  presetGrid: document.getElementById("presetGrid"),
  presetAddBtn: document.getElementById("presetAddBtn"),
  customAmountBtn: document.getElementById("customAmountBtn"),
  addPresetOverlay: document.getElementById("addPresetOverlay"),
  customAddOverlay: document.getElementById("customAddOverlay"),
  closeCustomAdd: document.getElementById("closeCustomAdd"),
  customAddSubmit: document.getElementById("customAddSubmit"),
  successOverlay: document.getElementById("successOverlay"),
  successTitle: document.getElementById("successTitle"),
  successSub: document.getElementById("successSub"),
  activityList: document.getElementById("activityList"),
  hideBalanceBtn: document.getElementById("hideBalanceBtn"),
  payBtn: document.getElementById("payBtn"),
  requestBtn: document.getElementById("requestBtn"),
  poolBtn: document.getElementById("poolBtn"),
  peopleOverlay: document.getElementById("peopleOverlay"),
  peopleTrack: document.getElementById("peopleTrack"),
  closePeople: document.getElementById("closePeople"),
  backPeople: document.getElementById("backPeople"),
  peopleVerb: document.getElementById("peopleVerb"),
  peopleAmount: document.getElementById("peopleAmount"),
  peopleList: document.getElementById("peopleList"),
  peopleSearch: document.getElementById("peopleSearch"),
  noteVerb: document.getElementById("noteVerb"),
  noteAmount: document.getElementById("noteAmount"),
  notePersonName: document.getElementById("notePersonName"),
  notePersonAvatar: document.getElementById("notePersonAvatar"),
  noteInput: document.getElementById("noteInput"),
  reviewBtn: document.getElementById("reviewBtn")
};

const flatKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];
const iosKeys = [
  { value: "1", letters: "" },
  { value: "2", letters: "ABC" },
  { value: "3", letters: "DEF" },
  { value: "4", letters: "GHI" },
  { value: "5", letters: "JKL" },
  { value: "6", letters: "MNO" },
  { value: "7", letters: "PQRS" },
  { value: "8", letters: "TUV" },
  { value: "9", letters: "WXYZ" },
  { value: ".", letters: "" },
  { value: "0", letters: "" },
  { value: "back", letters: "" }
];

function boot() {
  state.transactions = [...initialTransactions];
  renderPayKeypad();
  renderCustomKeypad();
  renderPeople(people);
  bindEvents();
  renderActivity();
  updateUI();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

function bindEvents() {
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });

  els.addMoneyBtn.addEventListener("click", openPresetSheet);
  els.addPresetOverlay.addEventListener("click", (event) => {
    if (event.target.classList.contains("dimmed")) closePresetSheet();
  });
  els.peopleOverlay.addEventListener("click", (event) => {
    if (event.target.classList.contains("dimmed")) closePeopleSheet();
  });

  els.presetGrid.addEventListener("click", handlePresetClick);
  els.presetAddBtn.addEventListener("click", () => addMoney(state.selectedPresetCents));
  els.closeCustomAdd.addEventListener("click", closeCustomAdd);
  els.customAddSubmit.addEventListener("click", () => addMoney(inputToCents(state.customAddInput)));
  els.hideBalanceBtn.addEventListener("click", toggleHiddenBalance);

  els.payBtn.addEventListener("click", () => openPeopleSheet("Pay"));
  els.requestBtn.addEventListener("click", () => openPeopleSheet("Request"));
  els.poolBtn.addEventListener("click", () => openPeopleSheet("Pool"));
  els.closePeople.addEventListener("click", closePeopleSheet);
  els.backPeople.addEventListener("click", () => els.peopleTrack.classList.remove("step-note"));
  els.peopleSearch.addEventListener("input", () => filterPeople(els.peopleSearch.value));
  els.noteInput.addEventListener("input", updateReviewButton);
  els.reviewBtn.addEventListener("click", finishPeopleFlow);

  document.getElementById("searchFromPay").addEventListener("click", () => switchTab("activity"));
  document.getElementById("searchFromBalance").addEventListener("click", () => switchTab("activity"));
  document.getElementById("searchFromActivity").addEventListener("click", () => els.peopleSearch?.focus());

  window.addEventListener("resize", () => requestAnimationFrame(fitAllMoney));
}

function renderPayKeypad() {
  els.payKeypad.innerHTML = "";
  flatKeys.forEach((key) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "flat-key";
    button.dataset.key = key;
    button.setAttribute("aria-label", key === "back" ? "Backspace" : key);

    if (key === "back") {
      button.innerHTML = '<span class="back-glyph"></span>';
    } else {
      button.textContent = key;
    }

    wireTouchClass(button);
    button.addEventListener("click", () => handleMoneyKey("payInput", key));
    els.payKeypad.appendChild(button);
  });
}

function renderCustomKeypad() {
  els.customAddKeypad.innerHTML = "";
  iosKeys.forEach((key) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ios-key";
    button.dataset.key = key.value;
    button.setAttribute("aria-label", key.value === "back" ? "Backspace" : key.value);

    if (key.value === "back") {
      button.innerHTML = '<span class="key-backbox"></span>';
    } else if (key.letters) {
      button.innerHTML = `<span>${key.value}</span><small>${key.letters}</small>`;
    } else {
      button.textContent = key.value;
    }

    wireTouchClass(button);
    button.addEventListener("click", () => handleMoneyKey("customAddInput", key.value));
    els.customAddKeypad.appendChild(button);
  });
}

function wireTouchClass(button) {
  button.addEventListener("pointerdown", () => button.classList.add("touching"));
  button.addEventListener("pointerup", () => button.classList.remove("touching"));
  button.addEventListener("pointercancel", () => button.classList.remove("touching"));
  button.addEventListener("pointerleave", () => button.classList.remove("touching"));
}

function handleMoneyKey(field, key) {
  if (key === "back") {
    state[field] = state[field].slice(0, -1);
  } else if (key === ".") {
    if (!state[field].includes(".")) state[field] = state[field] ? `${state[field]}.` : "0.";
  } else {
    state[field] = appendDigit(state[field], key);
  }

  updateUI();
}

function appendDigit(current, digit) {
  if (current === "0") current = "";
  const next = current + digit;
  if (!/^\d{0,9}(\.\d{0,2})?$/.test(next)) return current;
  return next;
}

function inputToCents(input) {
  if (!input || input === ".") return 0;
  const [wholeRaw, decimalRaw = ""] = input.split(".");
  const dollars = Number(wholeRaw || "0");
  const cents = Number((decimalRaw + "00").slice(0, 2));
  if (!Number.isFinite(dollars) || !Number.isFinite(cents)) return 0;
  return dollars * 100 + cents;
}

function centsToInput(cents) {
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

function formatCents(cents, withDecimals = true) {
  const value = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 2
  }).format(value);
}

function displayInput(input) {
  return input ? `$${input}` : "$0";
}

function updateUI() {
  els.payAmount.textContent = displayInput(state.payInput);
  els.customAddAmount.textContent = displayInput(state.customAddInput);

  const balanceText = state.hiddenBalance ? "$••••" : formatCents(state.currentBalanceCents, true);
  els.balanceAmount.textContent = balanceText;
  els.addPresetBalance.textContent = `Game balance ${balanceText}`;
  els.customAddBalance.textContent = `Game balance ${balanceText}`;

  const customCents = inputToCents(state.customAddInput);
  els.customAddSubmit.disabled = customCents <= 0;
  els.customAddSubmit.classList.toggle("disabled", customCents <= 0);
  els.customAddSubmit.textContent = customCents > 0 ? `Add ${formatCents(customCents, customCents % 100 !== 0)}` : "Add";

  els.presetAddBtn.disabled = state.selectedPresetCents <= 0;
  els.presetAddBtn.classList.toggle("disabled", state.selectedPresetCents <= 0);
  els.presetAddBtn.textContent = state.selectedPresetCents > 0 ? `Add ${formatCents(state.selectedPresetCents, state.selectedPresetCents % 100 !== 0)}` : "Add";

  requestAnimationFrame(fitAllMoney);
}

function fitAllMoney() {
  fitMoneyText(els.payAmount, 92, 50);
  fitMoneyText(els.balanceAmount, 72, 38);
  fitMoneyText(els.customAddAmount, 92, 50);
}

function fitMoneyText(el, mobileBase, minSize) {
  if (!el) return;
  const isMobile = window.matchMedia("(max-width: 450px)").matches;
  const base = isMobile ? mobileBase : Number(el.dataset.desktopBase || getComputedStyle(el).fontSize.replace("px", ""));
  const parent = el.parentElement;
  if (!parent) return;
  let size = base;
  el.style.fontSize = `${size}px`;
  const maxWidth = parent.clientWidth - 8;
  while (el.scrollWidth > maxWidth && size > minSize) {
    size -= 2;
    el.style.fontSize = `${size}px`;
  }
}

function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.dataset.screen === tab));
  document.querySelectorAll(".tab-btn").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  updateUI();
}

function openPresetSheet() {
  state.selectedPresetCents = 0;
  document.querySelectorAll(".preset-grid button").forEach((button) => button.classList.remove("selected"));
  openOverlay(els.addPresetOverlay);
  updateUI();
}

function closePresetSheet() {
  closeOverlay(els.addPresetOverlay);
}

function handlePresetClick(event) {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.custom === "true") {
    closePresetSheet();
    openCustomAdd();
    return;
  }

  state.selectedPresetCents = Number(button.dataset.cents || 0);
  document.querySelectorAll(".preset-grid button").forEach((node) => node.classList.toggle("selected", node === button));
  updateUI();
}

function openCustomAdd() {
  state.customAddInput = "";
  openOverlay(els.customAddOverlay);
  updateUI();
}

function closeCustomAdd() {
  closeOverlay(els.customAddOverlay);
}

function addMoney(cents) {
  if (!cents || cents <= 0) return;
  state.currentBalanceCents += cents;
  prependTransaction({ title: "Add money", subtitle: "Zolo debit\nJust now", amount: `+${formatCents(cents, cents % 100 !== 0)}`, tone: "green", kind: "plain" });
  closeOverlay(els.addPresetOverlay);
  closeOverlay(els.customAddOverlay);
  showSuccess("Added", `${formatCents(cents, true)} added to your game balance`, () => {
    switchTab("balance");
    state.selectedPresetCents = 0;
    state.customAddInput = "";
    updateUI();
  });
}

function toggleHiddenBalance() {
  state.hiddenBalance = !state.hiddenBalance;
  els.balanceAmount.classList.toggle("shake");
  setTimeout(() => els.balanceAmount.classList.remove("shake"), 280);
  updateUI();
}

function openPeopleSheet(mode) {
  state.flowMode = mode;
  state.selectedPerson = null;
  const amount = displayInput(state.payInput);
  els.peopleVerb.textContent = mode;
  els.peopleAmount.textContent = amount;
  els.noteVerb.textContent = mode;
  els.noteAmount.textContent = amount;
  els.peopleSearch.value = "";
  els.noteInput.value = "";
  els.peopleTrack.classList.remove("step-note");
  renderPeople(people);
  updateReviewButton();
  openOverlay(els.peopleOverlay);
}

function closePeopleSheet() {
  closeOverlay(els.peopleOverlay);
  setTimeout(() => els.peopleTrack.classList.remove("step-note"), 360);
}

function filterPeople(query) {
  const cleaned = query.trim().toLowerCase();
  const filtered = people.filter((person) => `${person.name} ${person.handle}`.toLowerCase().includes(cleaned));
  renderPeople(filtered);
}

function renderPeople(list) {
  els.peopleList.innerHTML = "";
  list.forEach((person) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "person-row";
    row.innerHTML = `
      <span class="person-avatar ${person.tone}">${escapeHTML(person.avatar || "")}</span>
      <span class="person-copy">
        <strong>${escapeHTML(person.name)}${person.business ? " <span aria-hidden='true' style='display:inline;color:#00D54B;font-size:.8em'>▰</span>" : ""}</strong>
        <span>${escapeHTML(person.handle)}</span>
      </span>
    `;
    row.addEventListener("click", () => selectPerson(person));
    els.peopleList.appendChild(row);
  });
}

function selectPerson(person) {
  state.selectedPerson = person;
  els.notePersonName.textContent = person.short;
  els.notePersonAvatar.textContent = person.avatar || "";
  els.notePersonAvatar.className = `tiny-person ${person.tone}`;
  els.peopleTrack.classList.add("step-note");
  setTimeout(() => els.noteInput.focus({ preventScroll: false }), 380);
}

function updateReviewButton() {
  const ready = els.noteInput.value.trim().length > 0;
  els.reviewBtn.disabled = !ready;
}

function finishPeopleFlow() {
  if (!state.selectedPerson || !els.noteInput.value.trim()) return;
  const cents = inputToCents(state.payInput);
  const amount = displayInput(state.payInput);
  const verb = state.flowMode;

  if (verb === "Pay" && cents > state.currentBalanceCents) {
    els.reviewBtn.classList.add("shake");
    els.reviewBtn.textContent = "Add funds";
    setTimeout(() => {
      els.reviewBtn.classList.remove("shake");
      els.reviewBtn.textContent = "Review";
    }, 850);
    return;
  }

  if (verb === "Pay") state.currentBalanceCents -= cents;

  prependTransaction({
    title: state.selectedPerson.name,
    subtitle: `${els.noteInput.value.trim()}\nJust now`,
    amount: verb === "Request" ? amount : `-${amount}`,
    tone: state.selectedPerson.tone,
    kind: "like",
    avatar: state.selectedPerson.avatar
  });

  closePeopleSheet();
  showSuccess(verb === "Request" ? "Requested" : verb === "Pool" ? "Pooled" : "Sent", `${amount} ${verb.toLowerCase()} action completed`, () => {
    state.payInput = "";
    updateUI();
    switchTab("activity");
  });
}

function prependTransaction(transaction) {
  state.transactions.unshift(transaction);
  renderActivity();
}

function renderActivity() {
  els.activityList.innerHTML = "";
  state.transactions.forEach((item) => {
    const row = document.createElement("article");
    row.className = "activity-row";

    const subtitle = item.subtitle.split("\n").map(escapeHTML).join("<br>");
    const avatarText = item.avatar || (item.tone === "green" ? "$" : item.title.charAt(0));
    const avatarClass = item.tone === "green" ? "" : item.tone;

    const right = item.kind === "like"
      ? `<span class="like-pill"><span class="heart"></span>${escapeHTML(item.amount.replace("-", ""))}</span>`
      : escapeHTML(item.amount);

    row.innerHTML = `
      <div class="activity-avatar ${avatarClass}">${escapeHTML(avatarText)}</div>
      <div class="activity-copy"><strong>${escapeHTML(item.title)}</strong><p>${subtitle}</p></div>
      <div class="activity-right">${right}</div>
    `;
    els.activityList.appendChild(row);
  });
}

function openOverlay(overlay) {
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
}

function closeOverlay(overlay) {
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}

function showSuccess(title, subtitle, callback) {
  els.successTitle.textContent = title;
  els.successSub.textContent = subtitle;
  els.successOverlay.classList.remove("hidden");
  els.successOverlay.setAttribute("aria-hidden", "false");

  window.setTimeout(() => {
    els.successOverlay.classList.add("hidden");
    els.successOverlay.setAttribute("aria-hidden", "true");
    window.setTimeout(() => callback?.(), 240);
  }, 1150);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;"
  }[char]));
}

boot();
