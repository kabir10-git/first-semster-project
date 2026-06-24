const icons = {
  Smartphones: "PH",
  Laptop: "LP",
  TV: "TV",
  Audio: "AU",
  Camera: "CA",
  Gaming: "GM",
  Accessories: "AC",
  Tablets: "TB"
};

const seedProducts = {
  Smartphones: ["iPhone 14 Pro", "Samsung Galaxy S23 Ultra", "Google Pixel 7 Pro", "OnePlus 11"],
  Laptop: ["MacBook Pro M2", "Dell XPS 13", "Lenovo ThinkPad X1", "HP Spectre x360"],
  TV: ["Sony BRAVIA OLED", "LG C3 OLED", "Samsung Neo QLED"],
  Audio: ["Sony XM5", "AirPods Max", "Bose QuietComfort"],
  Camera: ["Sony A7 IV", "Canon R6 II", "Fujifilm X-T5"],
  Gaming: ["PlayStation 5", "Xbox Series X", "Nintendo Switch OLED"],
  Accessories: ["Logitech MX Master", "Keychron Q1", "Anker Power Bank"],
  Tablets: ["iPad Pro", "Galaxy Tab S9", "Surface Pro 9"]
};

const conditions = ["Like New", "Good", "Fair"];
const locations = ["Kathmandu", "Pokhara", "Lalitpur", "Bhaktapur"];
const sellers = ["Kabir", "Ramesh", "Sita", "Anil", "Pooja"];
const storageOptions = {
  Smartphones: ["128GB", "256GB", "512GB"],
  Laptop: ["256GB SSD", "512GB SSD", "1TB SSD"],
  TV: ["55 inch", "65 inch", "75 inch"],
  Audio: ["Wireless", "Over Ear", "Bluetooth 5.3"],
  Camera: ["Body Only", "24-70mm Kit", "Dual Lens Kit"],
  Gaming: ["825GB", "1TB", "OLED Model"],
  Accessories: ["Standard", "Premium", "Compact"],
  Tablets: ["128GB", "256GB", "512GB"]
};
const colorOptions = ["Space Black", "Silver", "Blue", "Graphite", "White"];
const includedItems = ["Original box", "Charging cable", "Bill copy", "Protective case"];

let products = [];
let cart = [];
let activeCategory = "all";
let activeFilter = "all";
let searchText = "";
let toastTimer;
let authMode = "login";
let users = [];
let currentUser = null;

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

function pick(list){
  return list[Math.floor(Math.random() * list.length)];
}

function formatPrice(amount){
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function productImage(product){
  const query = encodeURIComponent(`${product.name} ${product.category} electronics`);
  return `https://source.unsplash.com/600x420/?${query}`;
}

function productDetails(category, condition, index){
  const monthsUsed = condition === "Like New" ? 2 + index : condition === "Good" ? 7 + index * 2 : 15 + index * 3;
  const batteryHealth = ["Smartphones", "Laptop", "Tablets", "Audio"].includes(category)
    ? Math.max(78, condition === "Like New" ? 96 - index : condition === "Good" ? 90 - index * 2 : 84 - index)
    : null;

  return {
    monthsUsed,
    batteryHealth,
    storage: pick(storageOptions[category] || ["Standard"]),
    color: pick(colorOptions),
    warranty: condition === "Like New" ? "6 months seller warranty" : condition === "Good" ? "1 month checking warranty" : "No warranty",
    accessories: includedItems.slice(0, condition === "Fair" ? 2 : 4),
    inspection: condition === "Fair" ? "Minor scratches, fully working" : "No repair history, tested working",
    delivery: "Meet-up or local delivery available"
  };
}

function createProducts(){
  let id = 1;

  Object.entries(seedProducts).forEach(([category, names]) => {
    names.forEach((name, index) => {
      const originalPrice = 40000 + index * 15000;
      const condition = pick(conditions);
      const discount = condition === "Like New" ? 0.8 : condition === "Good" ? 0.65 : 0.5;

      products.push({
        id: id++,
        name,
        category,
        condition,
        originalPrice,
        price: Math.round(originalPrice * discount),
        seller: pick(sellers),
        location: pick(locations),
        rating: (4 + Math.random()).toFixed(1),
        ...productDetails(category, condition, index)
      });
    });
  });
}

function visibleProducts(){
  let list = [...products];

  if(activeCategory !== "all"){
    list = list.filter(product => product.category === activeCategory);
  }

  if(["Like New", "Good", "Fair"].includes(activeFilter)){
    list = list.filter(product => product.condition === activeFilter);
  }

  if(activeFilter === "price-low"){
    list.sort((a, b) => a.price - b.price);
  }

  if(activeFilter === "price-high"){
    list.sort((a, b) => b.price - a.price);
  }

  if(searchText){
    const text = searchText.toLowerCase();
    list = list.filter(product => product.name.toLowerCase().includes(text));
  }

  return list;
}

function renderProducts(){
  const list = visibleProducts();
  $("#listingCount").textContent = `${list.length} products found`;

  $("#productGrid").innerHTML = list.length
    ? list.map(productCard).join("")
    : `<div class="empty-state"><h3>No products found</h3><p>Try another search or filter.</p></div>`;
}

function productCard(product){
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);

  return `
    <article class="product-card" onclick="openProductDetails(${product.id})" tabindex="0" role="button" onkeydown="handleProductCardKey(event, ${product.id})">
      <div class="product-image">
        <img src="${productImage(product)}" alt="${product.name}">
        <span>${icons[product.category] || "SB"}</span>
      </div>
      <div class="product-body">
        <div class="product-category">${product.category}</div>
        <h3 class="product-name">${product.name}</h3>
        <span class="condition">${product.condition}</span>
        <div class="price-row">
          <span class="current-price">${formatPrice(product.price)}</span>
          <span class="old-price">${formatPrice(product.originalPrice)}</span>
        </div>
        <div class="product-meta">
          <span>${product.seller}</span>
          <span>${product.location}</span>
          <span>${product.rating} rating</span>
          <span>Save ${discount}%</span>
        </div>
        <button class="add-cart-btn" onclick="addToCart(${product.id}, event)">Add to Cart</button>
      </div>
    </article>
  `;
}

function detailItem(label, value){
  if(value === null || value === undefined || value === "") return "";
  return `
    <div class="detail-item">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function handleProductCardKey(event, id){
  if(event.key === "Enter" || event.key === " "){
    event.preventDefault();
    openProductDetails(id);
  }
}

function openProductDetails(id){
  const product = products.find(item => item.id === id);
  if(!product) return;

  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
  $("#detailContent").innerHTML = `
    <div class="detail-media">
      <img src="${productImage(product)}" alt="${product.name}">
      <span>${product.condition}</span>
    </div>
    <div class="detail-info">
      <div class="product-category">${product.category}</div>
      <h2>${product.name}</h2>
      <div class="price-row">
        <span class="current-price">${formatPrice(product.price)}</span>
        <span class="old-price">${formatPrice(product.originalPrice)}</span>
        <span class="save-badge">Save ${discount}%</span>
      </div>
      <p class="detail-summary">${product.inspection}. ${product.delivery}.</p>

      <div class="detail-grid">
        ${detailItem("Used for", `${product.monthsUsed} months`)}
        ${detailItem("Battery health", product.batteryHealth ? `${product.batteryHealth}%` : "Not applicable")}
        ${detailItem("Storage / variant", product.storage)}
        ${detailItem("Color", product.color)}
        ${detailItem("Warranty", product.warranty)}
        ${detailItem("Rating", `${product.rating} / 5`)}
        ${detailItem("Seller", product.seller)}
        ${detailItem("Location", product.location)}
      </div>

      <div class="included-box">
        <h3>Included items</h3>
        <div class="included-list">
          ${product.accessories.map(item => `<span>${item}</span>`).join("")}
        </div>
      </div>

      <button class="add-cart-btn" onclick="addToCart(${product.id}, event)">Add to Cart</button>
    </div>
  `;

  $("#productDetailModal").classList.add("open");
}

function closeProductDetails(){
  $("#productDetailModal").classList.remove("open");
}

function addToCart(id, event){
  if(event) event.stopPropagation();
  const product = products.find(item => item.id === id);
  const existing = cart.find(item => item.id === id);

  existing ? existing.qty++ : cart.push({...product, qty: 1});
  updateCart();
  showToast(`${product.name} added to cart`);
}

function removeFromCart(id){
  cart = cart.filter(item => item.id !== id);
  updateCart();
  renderCart();
}

function updateCart(){
  $("#cartCount").textContent = cart.reduce((sum, item) => sum + item.qty, 0);
}

function renderCart(){
  if(!cart.length){
    $("#cartItems").innerHTML = `<div class="empty-state compact">Cart is empty</div>`;
    $("#cartFooter").style.display = "none";
    return;
  }

  $("#cartFooter").style.display = "block";
  $("#cartItems").innerHTML = cart.map(item => `
    <div class="cart-item">
      <div>
        <strong>${item.name}</strong>
        <span>${formatPrice(item.price)} x ${item.qty}</span>
      </div>
      <button onclick="removeFromCart(${item.id})" aria-label="Remove item">Remove</button>
    </div>
  `).join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  $("#cartTotal").textContent = formatPrice(total);
}

function setActive(selector, element){
  $$(selector).forEach(item => item.classList.remove("active"));
  element.classList.add("active");
}

function filterCat(category, element){
  activeCategory = category;
  setActive(".category-item", element);
  renderProducts();
}

function applyFilter(filter, element){
  activeFilter = filter;
  setActive(".filter-chip", element);
  renderProducts();
}

function doSearch(){
  searchText = $("#searchInput").value.trim();
  renderProducts();
}

function searchQuick(text){
  $("#searchInput").value = text;
  searchText = text;
  renderProducts();
}

function openCart(){
  $("#cartSidebar").classList.add("open");
  $("#cartOverlay").classList.add("open");
  renderCart();
}

function closeCart(){
  $("#cartSidebar").classList.remove("open");
  $("#cartOverlay").classList.remove("open");
}

function openSellModal(){
  $("#sellModal").classList.add("open");
}

function closeSellModal(){
  $("#sellModal").classList.remove("open");
}

function userInitial(name){
  return (name || "User").trim().charAt(0).toUpperCase();
}

function createUserProfile(name, email, password = ""){
  return {
    name,
    email,
    password,
    phone: "Not added",
    location: "Kathmandu",
    joined: "June 2026",
    payment: "Cash / Online",
    status: "Verified Buyer",
    orders: 2,
    saved: 5,
    listings: 1
  };
}

function updateAccountUI(){
  const loggedIn = Boolean(currentUser);
  $("#accountLabel").textContent = loggedIn ? currentUser.name : "Sign In";
  $("#accountAvatar").textContent = loggedIn ? userInitial(currentUser.name) : "?";
  $("#accountAvatar").classList.toggle("signed-in", loggedIn);
}

function openAccountOrLogin(){
  currentUser ? openAccountModal() : openLoginModal();
}

function openAccountModal(){
  if(!currentUser){
    openLoginModal();
    return;
  }

  $("#profileAvatar").textContent = userInitial(currentUser.name);
  $("#profileName").textContent = currentUser.name;
  $("#profileEmail").textContent = currentUser.email;
  $("#profileStatus").textContent = currentUser.status;
  $("#profileOrders").textContent = currentUser.orders;
  $("#profileSaved").textContent = currentUser.saved;
  $("#profileListings").textContent = currentUser.listings;
  $("#profilePhone").textContent = currentUser.phone;
  $("#profileLocation").textContent = currentUser.location;
  $("#profileJoined").textContent = currentUser.joined;
  $("#profilePayment").textContent = currentUser.payment;
  $("#accountModal").classList.add("open");
}

function closeAccountModal(){
  $("#accountModal").classList.remove("open");
}

function logoutUser(){
  currentUser = null;
  updateAccountUI();
  closeAccountModal();
  showToast("Logged out successfully");
}

function submitListing(){
  const name = $("#f_name").value.trim();
  const price = Number($("#f_price").value);
  const seller = $("#f_seller").value.trim();

  if(!name || !price || !seller){
    showToast("Please fill required fields");
    return;
  }

  products.unshift({
    id: Date.now(),
    name,
    price,
    seller,
    category: $("#f_cat").value,
    condition: $("#f_cond").value,
    originalPrice: Number($("#f_orig").value) || price,
    location: $("#f_loc").value.trim() || "Kathmandu",
    rating: "5.0",
    ...productDetails($("#f_cat").value, $("#f_cond").value, 0)
  });

  renderProducts();
  closeSellModal();
  showToast("Product added successfully");
}

function openLoginModal(){
  setAuthMode("login");
  $("#loginOverlay").classList.add("show");
  $("#loginModal").classList.add("show");
}

function closeLoginModal(){
  $("#loginOverlay").classList.remove("show");
  $("#loginModal").classList.remove("show");
}

function setAuthMode(mode){
  authMode = mode;
  const isRegister = mode === "register";

  $("#authTitle").textContent = isRegister ? "Create Account" : "Sign In";
  $("#authSubtitle").textContent = isRegister ? "Register as a new user" : "Access your account";
  $("#authBtn").textContent = isRegister ? "Register" : "Login";
  $("#authSwitchLink").textContent = isRegister ? "Already have an account?" : "Create Account";
  $("#forgotLink").style.display = isRegister ? "none" : "inline";
  $(".login-form").classList.toggle("register-mode", isRegister);
  $("#loginMsg").textContent = "";
}

function toggleAuthMode(){
  setAuthMode(authMode === "login" ? "register" : "login");
}

function handleAuth(){
  authMode === "register" ? registerUser() : handleLogin();
}

function handleLogin(){
  const email = $("#loginEmail").value.trim();
  const password = $("#loginPassword").value;
  const savedUser = users.find(user => user.email === email && user.password === password);
  const demoUser = email === "demo@nep" && password === "demo123"
    ? createUserProfile("Demo User", "demo@nep", "demo123")
    : null;
  const valid = savedUser || demoUser;

  $("#loginMsg").textContent = valid ? "" : "Invalid email or password";
  if(!valid) return;

  currentUser = savedUser || demoUser;
  updateAccountUI();
  closeLoginModal();
  showToast("Login successful");
}

function registerUser(){
  const name = $("#registerName").value.trim();
  const email = $("#loginEmail").value.trim();
  const password = $("#loginPassword").value;

  if(!name || !email || !password){
    $("#loginMsg").textContent = "Please fill all fields";
    return;
  }

  if(users.some(user => user.email === email)){
    $("#loginMsg").textContent = "Account already exists";
    return;
  }

  currentUser = createUserProfile(name, email, password);
  users.push(currentUser);
  updateAccountUI();
  closeLoginModal();
  showToast("Account created successfully");
}

function checkout(){
  if(!cart.length){
    showToast("Cart is empty");
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  $("#checkoutAmount").textContent = `Total: ${formatPrice(total)}`;
  $("#checkoutModal").classList.add("show");
}

function closeCheckout(){
  $("#checkoutModal").classList.remove("show");
}

function placeOrder(){
  cart = [];
  updateCart();
  renderCart();
  closeCheckout();
  closeCart();
  showToast("Order placed successfully");
}

function showToast(text){
  $("#toast").textContent = text;
  $("#toast").classList.add("show-alert");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show-alert"), 2500);
}

document.addEventListener("DOMContentLoaded", () => {
  createProducts();
  renderProducts();
  updateCart();
  updateAccountUI();

  $("#searchInput").addEventListener("keydown", event => {
    if(event.key === "Enter") doSearch();
  });

  $(".checkout-btn").addEventListener("click", checkout);
});
