document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.item');
    const updateTotalButton = document.getElementById('updateTotal');
    const modal = document.getElementById('myModal');
    const closeModal = modal.querySelector('.close');
    const cartItemsList = document.getElementById('cartItems');
    const totalPriceElement = document.getElementById('totalPrice');
    const confirmPaymentButton = document.getElementById('confirmPayment');

    // Event listeners for increase/decrease buttons in the cart
    items.forEach(item => {
        const decreaseButton = item.querySelector('.decrease');
        const increaseButton = item.querySelector('.increase');
        const quantityInput = item.querySelector('.quantity');

        decreaseButton.addEventListener('click', () => {
            let quantity = parseInt(quantityInput.value, 10);
            if (quantity > 1) {
                quantityInput.value = quantity - 1;
            }
            updateTotal();
        });

        increaseButton.addEventListener('click', () => {
            let quantity = parseInt(quantityInput.value, 10);
            quantityInput.value = quantity + 1;
            updateTotal();
        });
    });

    // Update total price and show modal
    updateTotalButton.addEventListener('click', () => {
        const selectedItems = Array.from(document.querySelectorAll('input[name="item"]:checked'));
        let totalPrice = 0;
        cartItemsList.innerHTML = '';
    
        selectedItems.forEach(item => {
            const price = parseFloat(item.dataset.price);
            const quantity = parseInt(item.parentElement.querySelector('.quantity').value, 10);
            const itemTotal = price * quantity;
            totalPrice += itemTotal;
    
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                ${item.parentElement.textContent.trim().split(' - ')[0]} - 
                Price: $${price.toFixed(2)} - 
                Quantity: <input type="number" class="modal-quantity" value="${quantity}" min="1" style="width: 40px; margin: 0 10px;">
                <button class="delete-item">Delete</button>
            `;
            cartItemsList.appendChild(listItem);
        });
    
        totalPriceElement.textContent = `Total Price: $${totalPrice.toFixed(2)}`;
        modal.style.display = 'block';
    
        // Add event listeners to dynamically added quantity inputs and delete buttons
        cartItemsList.querySelectorAll('.modal-quantity').forEach(input => {
            input.addEventListener('change', updateModalTotal);
        });
    
        cartItemsList.querySelectorAll('.delete-item').forEach(button => {
            button.addEventListener('click', (event) => {
                // Remove the list item containing the delete button
                event.target.parentElement.remove();
                updateModalTotal();
            });
        });
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Function to initiate payment via backend server
    function payWithMpesa(phoneNumber, amount) {
        fetch('/pay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phoneNumber, amount })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Payment initiated successfully. Redirecting to M-Pesa...');
                window.location.href = data.redirect_url; // Redirect to M-Pesa portal
            } else {
                throw new Error(data.error || 'Payment initiation failed.');
            }
        })
        .catch(error => {
            console.error('Error initiating payment:', error);
            alert('Failed to initiate payment. Please try again later.');
        });
    }
    
    function updateModalTotal() {
        const modalQuantityInputs = cartItemsList.querySelectorAll('.modal-quantity');
        let newTotalPrice = 0;
    
        modalQuantityInputs.forEach(input => {
            const quantity = parseInt(input.value, 10);
            const itemDescription = input.parentElement.textContent.split(' - ')[0].trim();
            const itemPrice = Array.from(document.querySelectorAll('input[name="item"]'))
                .find(item => item.parentElement.textContent.includes(itemDescription))
                .dataset.price;
            const price = parseFloat(itemPrice);
            const itemTotal = price * quantity;
            newTotalPrice += itemTotal;
            const totalSpan = input.parentElement.querySelector('.modal-item-total');
            if (totalSpan) {
                totalSpan.textContent = itemTotal.toFixed(2);
            } else {
                const newSpan = document.createElement('span');
                newSpan.classList.add('modal-item-total');
                newSpan.textContent = itemTotal.toFixed(2);
                input.parentElement.appendChild(newSpan);
            }
        });
    
        totalPriceElement.textContent = `Total Price: $${newTotalPrice.toFixed(2)}`;
    }

    async function generatePDFReceipt(phoneNumber) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
    
        doc.setFontSize(18);
        doc.text('E-Receipt', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Phone Number: ${phoneNumber}`, 20, 30);
        
        let yPosition = 40;
        
        // Get current items and quantities from the modal
        const items = Array.from(cartItemsList.children).map(item => {
            const description = item.textContent.split(' - ')[0].trim();
            const quantity = parseInt(item.querySelector('.modal-quantity').value, 10);
            const price = parseFloat(
                Array.from(document.querySelectorAll('input[name="item"]'))
                    .find(i => i.parentElement.textContent.includes(description))
                    .dataset.price
            );
            const itemTotal = price * quantity;
            return { description, quantity, price, itemTotal };
        });
    
        items.forEach((item, index) => {
            doc.text(
                `${index + 1}. ${item.description} - Quantity: ${item.quantity} - Price: $${item.price.toFixed(2)} - Total: $${item.itemTotal.toFixed(2)}`,
                20, yPosition
            );
            yPosition += 10;
        });
    
        const totalPrice = items.reduce((acc, item) => acc + item.itemTotal, 0);
        doc.text(`Total Price: $${totalPrice.toFixed(2)}`, 20, yPosition + 10);
        doc.save('receipt.pdf');
    }
    
    // Update this event listener to include PDF generation
    confirmPaymentButton.addEventListener('click', () => {
        const phoneNumber = prompt("Please enter your phone number (e.g., +2547XXXXXXXX):");
        if (phoneNumber) {
            const totalAmount = parseFloat(totalPriceElement.textContent.replace("Total Price: $", ""));
            payWithMpesa(phoneNumber, totalAmount);
            generatePDFReceipt(phoneNumber); // Pass phone number to the receipt generation
        }
    });
});
