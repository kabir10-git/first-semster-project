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

const productImageQueries = {
  "iPhone 14 Pro": "Apple iPhone 14 Pro product photo",
  "Samsung Galaxy S23 Ultra": "Samsung Galaxy S23 Ultra product photo",
  "Google Pixel 7 Pro": "Google Pixel 7 Pro product photo",
  "OnePlus 11": "OnePlus 11 product photo",
  "MacBook Pro M2": "Apple MacBook Pro M2 product photo",
  "Dell XPS 13": "Dell XPS 13 laptop product photo",
  "Lenovo ThinkPad X1": "Lenovo ThinkPad X1 Carbon product photo",
  "HP Spectre x360": "HP Spectre x360 product photo",
  "Sony BRAVIA OLED": "Sony BRAVIA OLED TV product photo",
  "LG C3 OLED": "LG C3 OLED TV product photo",
  "Samsung Neo QLED": "Samsung Neo QLED TV product photo",
  "Sony XM5": "Sony WH-1000XM5 headphones product photo",
  "AirPods Max": "Apple AirPods Max product photo",
  "Bose QuietComfort": "Bose QuietComfort headphones product photo",
  "Sony A7 IV": "Sony Alpha A7 IV camera product photo",
  "Canon R6 II": "Canon EOS R6 Mark II product photo",
  "Fujifilm X-T5": "Fujifilm X-T5 camera product photo",
  "PlayStation 5": "Sony PlayStation 5 console product photo",
  "Xbox Series X": "Microsoft Xbox Series X console product photo",
  "Nintendo Switch OLED": "Nintendo Switch OLED product photo",
  "Logitech MX Master": "Logitech MX Master 3S mouse product photo",
  "Keychron Q1": "Keychron Q1 mechanical keyboard product photo",
  "Anker Power Bank": "Anker power bank product photo",
  "iPad Pro": "Apple iPad Pro product photo",
  "Galaxy Tab S9": "Samsung Galaxy Tab S9 product photo",
  "Surface Pro 9": "Microsoft Surface Pro 9 product photo"
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
let homeMode = true;
let toastTimer;
let authMode = "login";
let users = [];
let currentUser = null;
let orders = [];

const DB_KEY = "nepSamanDatabase";
const SESSION_KEY = "nepSamanCurrentUser";

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

function pick(list){
  return list[Math.floor(Math.random() * list.length)];
}

function formatPrice(amount){
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function saveDatabase(){
  localStorage.setItem(DB_KEY, JSON.stringify({users, products, orders}));
  localStorage.setItem(SESSION_KEY, currentUser ? currentUser.email : "");
}

function loadDatabase(){
  const saved = JSON.parse(localStorage.getItem(DB_KEY) || "{}");
  users = Array.isArray(saved.users) ? saved.users : [];
  products = Array.isArray(saved.products) ? saved.products : [];
  orders = Array.isArray(saved.orders) ? saved.orders : [];

  const currentEmail = localStorage.getItem(SESSION_KEY);
  currentUser = users.find(user => user.email === currentEmail) || null;
}

let carouselStates = {}; // Track carousel position for each product

function productImages(product, imageIndex = 0){
  const views = ["product photo", "front view", "back view", "side view", "detail view"];
  const searchTerm = productImageQueries[product.name] || `${product.name} ${product.category} real product photo`;
  
  // Generate URL for specific image variation
  let query = searchTerm;
  if(imageIndex > 0 && imageIndex < views.length){
    query = `${searchTerm.replace("product photo", "").trim()} ${views[imageIndex]}`;
  }
  
  query = encodeURIComponent(query);
  return `https://tse.mm.bing.net/th?q=${query}&w=600&h=420&c=7&rs=1&p=${imageIndex}`;
}

function productImage(product){
  return productImages(product, 0);
}

function fallbackProductImage(product){
  const label = encodeURIComponent(product.name);
  return `https://placehold.co/600x420/fff7ed/f97316?text=${label}`;
}

function getImageCount(){
  return 5; // 5 different angles/views per product
}

function changeCarouselImage(productId, direction){
  if(!carouselStates[productId]){
    carouselStates[productId] = 0;
  }
  
  const maxImages = getImageCount();
  carouselStates[productId] = (carouselStates[productId] + direction + maxImages) % maxImages;
  
  const imgElement = $(`[data-product-carousel="${productId}"]`);
  const dotsContainer = $(`[data-carousel-dots="${productId}"]`);
  
  if(imgElement){
    const product = products.find(p => p.id === productId);
    if(product){
      imgElement.src = productImages(product, carouselStates[productId]);
      imgElement.onerror = function(){
        this.onerror = null;
        this.src = fallbackProductImage(product);
      };
    }
  }
  
  if(dotsContainer){
    updateCarouselDots(dotsContainer, carouselStates[productId], maxImages);
  }
}

function changeDetailCarouselImage(productId, direction){
  const stateKey = `detail-${productId}`;
  if(!carouselStates[stateKey]){
    carouselStates[stateKey] = 0;
  }
  
  const maxImages = getImageCount();
  carouselStates[stateKey] = (carouselStates[stateKey] + direction + maxImages) % maxImages;
  
  const imgElement = $(`[data-detail-carousel="${productId}"]`);
  const dotsContainer = $(`[data-detail-carousel-dots="${productId}"]`);
  
  if(imgElement){
    const product = products.find(p => p.id === productId);
    if(product){
      imgElement.src = productImages(product, carouselStates[stateKey]);
      imgElement.onerror = function(){
        this.onerror = null;
        this.src = fallbackProductImage(product);
      };
    }
  }
  
  if(dotsContainer){
    updateCarouselDots(dotsContainer, carouselStates[stateKey], maxImages);
  }
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
  if(products.length) return;

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
        sellerEmail: "market@nepsaman.local",
        location: pick(locations),
        rating: (4 + Math.random()).toFixed(1),
        verified: true,
        ...productDetails(category, condition, index)
      });
    });
  });

  saveDatabase();
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
  updateHeroVisibility();

  $("#productGrid").innerHTML = list.length
    ? list.map(productCard).join("")
    : `<div class="empty-state"><h3>No products found</h3><p>Try another search or filter.</p></div>`;
}

function updateHeroVisibility(){
  const isHomeView = homeMode && activeCategory === "all" && activeFilter === "all" && !searchText;
  const hero = $(".hero-section");
  if(hero) hero.classList.toggle("is-hidden", !isHomeView);
}

function updateCarouselDots(dotsContainer, currentIndex, maxDots){
  $$(`[data-carousel-dots="${dotsContainer.getAttribute("data-carousel-dots")}"] .dot`).forEach((dot, index) => {
    dot.classList.toggle("active", index === currentIndex);
  });
}

function productCard(product){
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
  const imageCount = getImageCount();
  const dotsHTML = Array.from({length: imageCount}, (_, i) => 
    `<span class="dot ${i === 0 ? "active" : ""}" onclick="event.stopPropagation(); changeCarouselImage(${product.id}, ${i - (carouselStates[product.id] || 0)})"></span>`
  ).join("");

  return `
    <article class="product-card" onclick="openProductDetails(${product.id})" tabindex="0" role="button" onkeydown="handleProductCardKey(event, ${product.id})">
      <div class="product-image">
        <img data-product-carousel="${product.id}" src="${productImage(product)}" alt="${product.name}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${fallbackProductImage(product)}';">
        <span>${icons[product.category] || "SB"}</span>
        <div class="carousel-controls">
          <button class="carousel-btn prev" onclick="event.stopPropagation(); changeCarouselImage(${product.id}, -1)" aria-label="Previous image">‹</button>
          <button class="carousel-btn next" onclick="event.stopPropagation(); changeCarouselImage(${product.id}, 1)" aria-label="Next image">›</button>
        </div>
        <div class="carousel-dots" data-carousel-dots="${product.id}">${dotsHTML}</div>
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
          <span>${product.verified ? "Verified product" : "Pending verification"}</span>
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

  // Reset carousel for detail view
  if(!carouselStates[`detail-${id}`]){
    carouselStates[`detail-${id}`] = 0;
  }

  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
  const imageCount = getImageCount();
  const dotsHTML = Array.from({length: imageCount}, (_, i) => 
    `<span class="dot ${i === 0 ? "active" : ""}" onclick="changeDetailCarouselImage(${id}, ${i - (carouselStates[`detail-${id}`] || 0)})"></span>`
  ).join("");

  $("#detailContent").innerHTML = `
    <div class="detail-media">
      <img data-detail-carousel="${id}" src="${productImages(product, 0)}" alt="${product.name}" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${fallbackProductImage(product)}';">
      <span>${product.condition}</span>
      <div class="carousel-controls">
        <button class="carousel-btn prev" onclick="changeDetailCarouselImage(${id}, -1)" aria-label="Previous image">‹</button>
        <button class="carousel-btn next" onclick="changeDetailCarouselImage(${id}, 1)" aria-label="Next image">›</button>
      </div>
      <div class="carousel-dots" data-detail-carousel-dots="${id}">${dotsHTML}</div>
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
        ${detailItem("Verification", product.verified ? "Verified product" : "Pending verification")}
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
  homeMode = category === "all";
  if(category === "all"){
    searchText = "";
    $("#searchInput").value = "";
  }
  setActive(".category-item", element);
  renderProducts();
}

function applyFilter(filter, element){
  activeFilter = filter;
  homeMode = filter === "all" && activeCategory === "all" && !searchText;
  setActive(".filter-chip", element);
  renderProducts();
}

function doSearch(){
  searchText = $("#searchInput").value.trim();
  homeMode = !searchText;
  renderProducts();
  if(searchText) scrollToProducts();
}

function searchQuick(text){
  $("#searchInput").value = text;
  searchText = text;
  homeMode = false;
  renderProducts();
  scrollToProducts();
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
  if(!currentUser){
    openLoginModal();
    showToast("Please sign in before selling a product");
    return;
  }

  $("#f_seller").value = currentUser.name;
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
    saved: 0
  };
}

function userListings(email){
  return products.filter(product => product.sellerEmail === email);
}

function userBuyerOrders(email){
  return orders.filter(order => order.buyerEmail === email);
}

function userSellerSales(email){
  return orders.flatMap(order => order.items
    .filter(item => item.sellerEmail === email)
    .map(item => ({...item, orderId: order.id, buyerName: order.buyerName, date: order.date, paymentMethod: order.paymentMethod})));
}

function historyMarkup(items, emptyText){
  if(!items.length) return `<div class="empty-state compact">${emptyText}</div>`;

  return items.map(item => `
    <div class="history-item">
      <strong>${item.name || `Order ${item.id}`}</strong>
      <span>${item.qty ? `Qty ${item.qty} - ` : ""}${formatPrice(item.total || (item.price || 0) * (item.qty || 1))}</span>
      <span>${item.date}${item.paymentMethod ? ` - ${item.paymentMethod}` : ""}</span>
      ${item.buyerName ? `<span>Buyer: ${item.buyerName}</span>` : ""}
    </div>
  `).join("");
}

function renderAccountHistory(){
  const buyerOrders = userBuyerOrders(currentUser.email).map(order => ({
    id: order.id,
    name: `Order ${order.id}`,
    total: order.total,
    date: order.date,
    paymentMethod: order.paymentMethod
  }));
  const sellerSales = userSellerSales(currentUser.email);

  $("#buyerHistory").innerHTML = historyMarkup(buyerOrders, "No purchases yet");
  $("#sellerHistory").innerHTML = historyMarkup(sellerSales, "No seller sales yet");
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
  $("#profileOrders").textContent = userBuyerOrders(currentUser.email).length;
  $("#profileSaved").textContent = currentUser.saved;
  $("#profileListings").textContent = userListings(currentUser.email).length;
  $("#profilePhone").textContent = currentUser.phone;
  $("#profileLocation").textContent = currentUser.location;
  $("#profileJoined").textContent = currentUser.joined;
  $("#profilePayment").textContent = currentUser.payment;
  renderAccountHistory();
  $("#accountModal").classList.add("open");
}

function closeAccountModal(){
  $("#accountModal").classList.remove("open");
}

function logoutUser(){
  currentUser = null;
  saveDatabase();
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
    sellerEmail: currentUser.email,
    category: $("#f_cat").value,
    condition: $("#f_cond").value,
    originalPrice: Number($("#f_orig").value) || price,
    location: $("#f_loc").value.trim() || "Kathmandu",
    rating: "5.0",
    verified: true,
    ...productDetails($("#f_cat").value, $("#f_cond").value, 0)
  });

  saveDatabase();
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
  const valid = savedUser;

  $("#loginMsg").textContent = valid ? "" : "Invalid email or password";
  if(!valid) return;

  currentUser = savedUser;
  saveDatabase();
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
  saveDatabase();
  updateAccountUI();
  closeLoginModal();
  showToast("Account created successfully");
}

function checkout(){
  if(!currentUser){
    openLoginModal();
    showToast("Please sign in before checkout");
    return;
  }

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
  if(!currentUser || !cart.length) return;

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  orders.unshift({
    id: Date.now(),
    buyerName: currentUser.name,
    buyerEmail: currentUser.email,
    date: new Date().toLocaleDateString("en-GB", {year: "numeric", month: "short", day: "numeric"}),
    paymentMethod: $("#paymentMethod").value,
    total,
    items: cart.map(item => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
      price: item.price,
      seller: item.seller,
      sellerEmail: item.sellerEmail || "market@nepsaman.local"
    }))
  });

  cart = [];
  saveDatabase();
  updateCart();
  renderCart();
  closeCheckout();
  closeCart();
  showToast("Order placed successfully");
}

function scrollToProducts(){
  document.querySelector(".product-section").scrollIntoView({behavior: "smooth", block: "start"});
}

function showVerifiedProducts(){
  activeCategory = "all";
  activeFilter = "all";
  searchText = "";
  homeMode = false;
  $("#searchInput").value = "";
  $$(".category-item").forEach(item => item.classList.toggle("active", item.textContent.trim() === "All Products"));
  $$(".filter-chip").forEach(item => item.classList.toggle("active", item.textContent.trim() === "All"));
  renderProducts();
  scrollToProducts();
  showToast("Showing verified product listings");
}

function showFairPricing(){
  activeFilter = "price-low";
  homeMode = false;
  const chip = [...$$(".filter-chip")].find(item => item.textContent.trim() === "Lowest Price");
  if(chip) setActive(".filter-chip", chip);
  renderProducts();
  scrollToProducts();
  showToast("Products sorted by lowest fair price");
}

function showSecurePayment(){
  if(cart.length){
    checkout();
    return;
  }

  scrollToProducts();
  showToast("Add a product to cart to use secure payment");
}

function showToast(text){
  $("#toast").textContent = text;
  $("#toast").classList.add("show-alert");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show-alert"), 2500);
}

document.addEventListener("DOMContentLoaded", () => {
  loadDatabase();
  createProducts();
  renderProducts();
  updateCart();
  updateAccountUI();

  $("#searchInput").addEventListener("keydown", event => {
    if(event.key === "Enter") doSearch();
  });

  $(".checkout-btn").addEventListener("click", checkout);
});
