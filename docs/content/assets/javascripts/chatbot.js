function openChat() {
  var container = document.getElementById('chat_container');
  if (container) {
    container.style.display = 'block';  
  }
}
  
function closeChat() {
  var container = document.getElementById('chat_container');
  if (container) {
    container.style.display = 'none';  
  }
}
  
const API_URL = "http://localhost:8888/query";

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

function sendMessage() {
  const question = chatInput.value.trim();
  if (!question) return;

  const userMsg = document.createElement('p');
  userMsg.className = 'user';
  userMsg.textContent = "You: " + question;
  chatMessages.appendChild(userMsg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  chatInput.value = "";

  document.getElementById('chatSpinner').style.display = 'block';

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: question })
  })
  .then(response => response.json())
  .then(data => {
    document.getElementById('chatSpinner').style.display = 'none';

    const botMsg = document.createElement('p');
    botMsg.className = 'bot';
    botMsg.textContent = "Bot: " + data.answer;
    chatMessages.appendChild(botMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  })
  .catch(err => {
    console.error("Error querying notebook API:", err);
    document.getElementById('chatSpinner').style.display = 'none';

    const errorMsg = document.createElement('p');
    errorMsg.className = 'bot';
    errorMsg.textContent = "Error: unable to get response.";
    chatMessages.appendChild(errorMsg);
  });
}


sendBtn.onclick = sendMessage;
chatInput.onkeypress = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
};