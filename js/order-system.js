let cart = [];
let total = 0;

// Opening hours: 7 AM – 3 PM
const openingHour = 7;
const closingHour = 15;

function checkOpeningHours() {
    const now = new Date();
    const hour = now.getHours();
    const statusDiv = document.getElementById("storeStatus");
    if(hour < openingHour || hour >= closingHour) {
        statusDiv.innerHTML = `<div class="closed">Sorry, we are currently closed.<br>Opening Hours: 7:00 AM – 3:00 PM</div>`;
        return false;
    } else { statusDiv.innerHTML = ""; return true; }
}

function addToCart(name, price) {
    if(!checkOpeningHours()) return;
    cart.push({name, price});
    total += price;
    renderCart();
}

function renderCart() {
    const list = document.getElementById("cartList");
    list.innerHTML = "";
    cart.forEach((item,index) => {
        list.innerHTML += `<li>${item.name} - $${item.price} <button onclick="removeItem(${index})">X</button></li>`;
    });
    document.getElementById("total").innerText = total.toFixed(2);
}

function removeItem(index){
    total -= cart[index].price;
    cart.splice(index,1);
    renderCart();
}

function checkout() {
    if(!checkOpeningHours()) return;

    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    if(!name || !phone) { alert("Please enter name and phone"); return; }
    if(cart.length===0){ alert("Cart is empty"); return; }

    const orderNumber = "DB"+Date.now();
    const newOrder = { orderNumber, customerName: name, customerPhone: phone, items: cart, total, time: new Date().toLocaleString(), status:"Pending" };

    let orders = JSON.parse(localStorage.getItem("daybreakOrders"))||[];
    orders.push(newOrder);
    localStorage.setItem("daybreakOrders", JSON.stringify(orders));

    alert(`Order Placed! Order Number: ${orderNumber}\nPlease pay at counter.`);
    cart = []; total=0; renderCart();
    document.getElementById("customerName").value="";
    document.getElementById("customerPhone").value="";
}

checkOpeningHours();
