import { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faX } from '@fortawesome/free-solid-svg-icons';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

function ChatBot(): JSX.Element {
  const [showChatBox, setShowChatBox] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const showChatRemoveToolTip = () => {
    setShowChatBox(true);
    setShowTooltip(false);
  };

  return (
    <div className='fixed bottom-0 right-2' style={{ zIndex: 9999 }}>
      {
        !showChatBox && (
          <div 
            onMouseEnter={() => setShowTooltip(true)} 
            onMouseLeave={() => setShowTooltip(false)}
          >
            <img 
              src='/img/chatbot_icon.png' 
              onClick={showChatRemoveToolTip}
              width={70}
              height={70}
              className='hover:cursor-pointer mb-3'
            />
            
            {showTooltip && (
              <div className='absolute bottom-16 right-2 bg-white text-black p-2 rounded shadow w-[28rem] font-semibold'>
                Greetings! Let's chat! Click me to get assistance from Jake, your AI buddy!
              </div>
            )}
          </div>
        )
      }
      
      {showChatBox && <ChatBox setShowChatBox={setShowChatBox} />}
    </div>
  );
}

function ChatBox({ setShowChatBox }: { setShowChatBox: React.Dispatch<React.SetStateAction<boolean>> }) {
  const [message, setMessage] = useState<string>('');
  const [conversation, setConversation] = useState<Message[]>([]);

  const handleSendMessage = async () => {
    if (message.trim()) {
      const userMessage: Message = { sender: 'user', text: message };
      setConversation(prevConversation => [...prevConversation, userMessage]);

      try {
        const res = await axios.post<{ response: string }>('https://clamscanner.com/py/message/chatbot', { message });
        simulateTypingEffect(res.data.response);
      } catch (error) {
        console.error("There was an error sending the message!", error);
        const errorMessage: Message = { sender: 'bot', text: "There was an error sending the message." };
        setConversation(prevConversation => [...prevConversation, errorMessage]);
      }

      setMessage('');
    }
  };

  const simulateTypingEffect = async (text: string) => {
    const typingDelay = 10;
    let botMessage = { sender: 'bot', text: '' } as Message;
    setConversation(prevConversation => [...prevConversation, botMessage]);

    for (let i = 0; i < text.length; i++) {
      await new Promise(resolve => setTimeout(resolve, typingDelay));
      botMessage = { sender: 'bot', text: botMessage.text + text[i] };
      setConversation(prevConversation => {
        const newConversation = [...prevConversation];
        newConversation[newConversation.length - 1] = botMessage;
        return newConversation;
      });
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col justify-between w-[40rem]">
      
      <FontAwesomeIcon 
        icon={faX} 
        className='absolute top-2 left-3 text-3xl hover:cursor-pointer hover:opacity-75 '
        onClick={() => setShowChatBox(false)}
      />

      { 
        conversation.length == 0 && 
          (
            <div className="w-full h-96 flex flex-col items-center justify-center">
              <img src='/img/chatbot_icon.png' width={70} height={70} />
              <SampleBotQuestions setMessage={setMessage} />
            </div>
         
          ) 
      }

      {
        conversation.length > 0 && (
            <div className="h-full flex flex-col-reverse overflow-y-auto p-4 font-semibold text-white gap-2">
              {conversation.slice(0).reverse().map((chat, index) => (
                <div key={index} className={`flex mb-2 ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg p-2 max-w-2/3 ${chat.sender === 'user' ? 'bg-blue-600 ml-auto' : 'bg-gray-600 mr-auto'}`}>
                    <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{chat.text}</p>
                  </div>
                </div>
              ))}
            </div>
        )
      }

      <div className="p-4">

        <div className="flex items-center">

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyUpCapture={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="border border-gray-300 rounded-lg px-4 py-2 mr-2 w-full focus:outline-none resize-none overflow-hidden"
            style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word', height: 'auto' }}
          />

          <button onClick={handleSendMessage} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 focus:outline-none">
            Send
          </button>

        </div>
      </div>

    </div>
  );
}

function SampleBotQuestions({setMessage}: {
  setMessage: React.Dispatch<React.SetStateAction<string>>
}){

  const sampleQuestions = [
    {question: "Display the total Dataset Images"},
    {question: "Count the reports in all Provinces"},
    {question: "How to get a good performing classification model?"},
  ]

  return(
    <div className='w-[90%] flex justify-evenly gap-3 mt-5 font-semibold'>
       {
          sampleQuestions.map((item, index) => (
              <div 
                key={index} 
                className="border border-gray-500 rounded p-2 hover:bg-gray-200 hover:cursor-pointer"
                onClick={() => setMessage(item.question)}
              >
                <h1> {item.question} </h1>
              </div>
          ))
        }
    </div>
  )
}

export default ChatBot;
