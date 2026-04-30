import { useState, useRef, useEffect } from 'react';
import Card from '../ui/Card';
import { apiUrl } from '../config';
import './ChatBotPage.css';

export default function ChatBotPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hi! I'm your Health Assistant. Ask me about precautions for any symptoms or diseases. For example, try asking: 'What precautions should I take for fever?' or 'How to prevent cough?'",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getPrecautions = async (query) => {
    try {
      const response = await fetch(apiUrl('/api/precautions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.toLowerCase() }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.response;
      } else {
        return getDefaultPrecautions(query);
      }
    } catch (err) {
      console.error('Error:', err);
      return getDefaultPrecautions(query);
    }
  };

  const getDefaultPrecautions = (query) => {
    const precautionsDB = {
      fever: {
        title: '🌡️ Precautions for Fever',
        points: [
          'Rest: Get adequate sleep to help your body fight the infection',
          'Stay hydrated: Drink plenty of water, warm tea, or electrolyte drinks',
          'Monitor temperature: Use a thermometer regularly and track readings',
          'Medication: Take paracetamol or ibuprofen as directed (follow dosage)',
          'Cool compress: Apply cool, damp cloth to forehead and neck',
          'Light clothing: Avoid heavy blankets; wear light, breathable clothes',
          'Nutrition: Eat light, easily digestible foods',
          'Isolation: Stay away from others if possible to prevent spreading',
          'Seek medical help: If fever persists beyond 3-5 days or exceeds 103°F (39.4°C)',
        ],
      },
      cough: {
        title: '🫁 Precautions for Cough',
        points: [
          'Stay hydrated: Drink warm water, honey lemon tea, or herbal remedies',
          'Use a humidifier: Add moisture to the air to ease coughing',
          'Avoid irritants: Stay away from smoke, pollution, and strong odors',
          'Throat lozenges: Use sugar-free lozenges to soothe throat',
          'Elevation: Sleep with an extra pillow to ease breathing',
          'Cough syrup: Use over-the-counter cough suppressants if needed',
          'Avoid dairy: Milk can increase mucus production',
          'Warm compresses: Apply to chest for relief',
          'Cover mouth: Use a mask when around others to prevent spread',
          'Rest voice: Avoid talking excessively to prevent further irritation',
        ],
      },
      'sore throat': {
        title: '👄 Precautions for Sore Throat',
        points: [
          'Gargle with salt water: Mix 1/2 teaspoon salt in warm water, gargle 3-4 times daily',
          'Use throat lozenges: Soothing lozenges with honey or menthol help',
          'Stay hydrated: Drink warm herbal teas, warm water with honey',
          'Avoid irritants: Don\'t smoke or expose to secondhand smoke',
          'Use a humidifier: Moist air helps ease throat discomfort',
          'Eat soft foods: Avoid spicy, hot, or hard foods',
          'Rest: Get adequate sleep to help recovery',
          'Honey: A spoonful of honey can coat and soothe throat (avoid for children under 1 year)',
          'Avoid cold drinks: Stick to warm beverages',
          'See doctor: If pain persists beyond a week or worsens',
        ],
      },
      headache: {
        title: '🤕 Precautions for Headache',
        points: [
          'Rest: Take a break from work and relax in a quiet, dark room',
          'Stay hydrated: Dehydration is a common headache trigger',
          'Pain relief: Take aspirin, ibuprofen, or paracetamol as directed',
          'Apply cold/heat: Use an ice pack or heating pad on forehead or neck',
          'Neck stretch: Gently stretch neck muscles if tension-related',
          'Avoid bright lights: Dim lights reduce headache intensity',
          'Skip caffeine: Avoid excess caffeine which can trigger migraines',
          'Eat regularly: Skipping meals can trigger headaches',
          'Practice relaxation: Deep breathing, meditation, or yoga',
          'See doctor: If severe, recurring, or accompanied by other symptoms',
        ],
      },
      fatigue: {
        title: '⚡ Precautions for Fatigue',
        points: [
          'Sleep: Get 7-9 hours of quality sleep every night',
          'Rest regularly: Take short breaks during the day',
          'Nutrition: Eat balanced meals with proteins, carbs, and healthy fats',
          'Hydration: Drink plenty of water throughout the day',
          'Exercise: Light physical activity can boost energy (avoid overexertion)',
          'Limit stress: Practice meditation, yoga, or relaxation techniques',
          'Reduce caffeine: Especially before bedtime',
          'Vitamin B12: Consider supplements if deficient',
          'Iron levels: Check if anemia might be causing fatigue',
          'See doctor: If fatigue persists for weeks without clear cause',
        ],
      },
      flu: {
        title: '🦠 Precautions for Flu (Influenza)',
        points: [
          'Get vaccinated: Annual flu vaccine is the best prevention',
          'Rest: Get plenty of sleep to help immune system fight virus',
          'Stay hydrated: Drink water, warm tea, soups, and broths',
          'Isolation: Stay home for at least 5-7 days to prevent spreading',
          'Antiviral medication: Consult doctor about oseltamivir (Tamiflu) within 48 hours of symptoms',
          'Pain relief: Use acetaminophen or ibuprofen for fever and aches',
          'Respiratory hygiene: Cover mouth when coughing/sneezing',
          'Hand hygiene: Wash hands frequently with soap and water',
          'Avoid contact: Keep distance from family members if possible',
          'Monitor symptoms: Watch for severe symptoms requiring emergency care',
        ],
      },
      cold: {
        title: '🤧 Precautions for Common Cold',
        points: [
          'Rest: Allow your body time to heal with adequate rest',
          'Fluids: Drink warm water, herbal tea, warm lemon water with honey',
          'Vitamin C: Eat citrus fruits, berries, or take supplements',
          'Saline nasal drops: Clear nasal congestion naturally',
          'Honey: A spoonful of honey helps soothe throat and cough',
          'Elevate head: Sleep with extra pillows to ease breathing',
          'Warm compress: Apply to sinuses for relief',
          'Avoid dairy: Reduces mucus production',
          'Hygiene: Wash hands and cover mouth to prevent spreading',
          'Prevention: Avoid close contact with sick people, maintain hygiene',
        ],
      },
    };

    // Check for keywords in query
    for (const [symptom, data] of Object.entries(precautionsDB)) {
      if (query.includes(symptom)) {
        return `\n${data.title}\n\n${data.points.map((point, i) => `${i + 1}. ${point}`).join('\n')}\n\n💡 Remember: These are general guidelines. Always consult a healthcare professional for personalized medical advice.`;
      }
    }

    return "I understand you're asking about precautions. Could you please specify a symptom or condition? I can help with: fever, cough, sore throat, headache, fatigue, flu, cold, and more. Try asking 'What precautions should I take for [symptom]?'";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Get response
    const response = await getPrecautions(input);

    const botMessage = {
      id: messages.length + 2,
      text: response,
      sender: 'bot',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);
  };

  return (
    <div className="chatbot-page fade-in">
      <div className="container">
        <div className="chatbot-header">
          <h1>🤖 AI Health Assistant</h1>
          <p>Ask me about precautions and health guidelines for any symptoms</p>
        </div>

        <Card className="chatbot-container" glow>
          <div className="messages-container">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.sender === 'bot' ? 'bot-message' : 'user-message'}`}
              >
                <div className="message-avatar">
                  {msg.sender === 'bot' ? '🤖' : '👤'}
                </div>
                <div className="message-content">
                  <p>{msg.text}</p>
                  <small className="message-time">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </small>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot-message">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="input-form">
            <div className="input-group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about precautions for any symptom..."
                disabled={isLoading}
                className="chat-input"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="send-button"
              >
                {isLoading ? '⏳' : '📤'}
              </button>
            </div>
          </form>
        </Card>

        <div className="chatbot-info">
          <h3>💡 Quick Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <span className="tip-emoji">🎯</span>
              <p>Ask specific questions like "What precautions for fever?"</p>
            </div>
            <div className="tip-card">
              <span className="tip-emoji">⚕️</span>
              <p>Always consult a doctor for serious symptoms</p>
            </div>
            <div className="tip-card">
              <span className="tip-emoji">🏥</span>
              <p>Seek emergency care for severe conditions</p>
            </div>
            <div className="tip-card">
              <span className="tip-emoji">📋</span>
              <p>These are general guidelines, not medical diagnosis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
