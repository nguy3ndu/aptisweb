import React, { useState, useCallback, useEffect } from "react";

// --- KIỂU DỮ LIỆU ---
interface AnswerOption {
  text: string;
  isCorrect: boolean;
}

interface Question {
  question: string;
  options: AnswerOption[];
  explanation: string;
}

// Cấu trúc cho dạng Q16-17
interface MultiQuestionSet {
  id: string;
  topic: string;
  audioSrc?: string; // (Tùy chọn) file âm thanh
  questionGroup16: {
    question16_1: Question;
    question16_2: Question;
  };
  questionGroup17: {
    question17_1: Question;
    question17_2: Question;
  };
}

// Kiểu dữ liệu History cho câu hỏi đơn
interface SimpleHistoryEntry {
  selectedAnswer: AnswerOption | null;
  isAnswerChecked: boolean;
  shuffledOptions: AnswerOption[];
}

// Kiểu dữ liệu History cho Q16-17
interface MultiHistoryEntry {
  selectedAnswers: Record<string, AnswerOption | null>; // { q16_1: ..., q16_2: ... }
  isAnswerChecked: boolean;
}

// --- SPINNER LOADING ---
const Spinner: React.FC = () => (
  <div className="flex justify-center items-center p-8">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// --- ICON ---
const IconSparkles: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
    />
  </svg>
);

// --- ỨNG DỤNG CHÍNH ---
export default function App() {
  // Thay đổi activeTopic từ number sang string để linh hoạt
  const [activeTopic, setActiveTopic] = useState<string>("topic1");
  const [loading, setLoading] = useState<boolean>(false);
  const [manualIndex, setManualIndex] = useState(0);

  // --- State cho Dạng Câu hỏi Đơn ---
  const [questionData, setQuestionData] = useState<Question | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<AnswerOption[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(
    null
  );
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [simpleHistory, setSimpleHistory] = useState<
    Record<number, SimpleHistoryEntry>
  >({});

  // --- State cho Dạng Q16-17 ---
  const [currentSet, setCurrentSet] = useState<MultiQuestionSet | null>(null);
  const [multiSelectedAnswers, setMultiSelectedAnswers] = useState<
    Record<string, AnswerOption | null>
  >({});
  const [isMultiAnswerChecked, setIsMultiAnswerChecked] =
    useState<boolean>(false);
  const [multiHistory, setMultiHistory] = useState<
    Record<number, MultiHistoryEntry>
  >({});

  // --- TRỘN ĐÁP ÁN ---
  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
  }, []);

  // --- 5 BỘ CÂU HỎI THEO CHỦ ĐỀ ---
  const topic1: Question[] = [
     {
    question: "1.Jane is calling her friend Martha. What time are they going to meet?",
    options: [
      { text: "5:30", isCorrect: true },
      { text: "5:00", isCorrect: false },
      { text: "6:00", isCorrect: false },
    ],
    explanation: "2.The given answer is 5:30 — that's the scheduled meeting time.",
  },
  {
    question: "What time will the friends meet?",
    options: [
      { text: "6:30 pm", isCorrect: true },
      { text: "6:00 pm", isCorrect: false },
      { text: "7:30 pm", isCorrect: false },
    ],
    explanation: "The correct time in the source is 6:30 pm.",
  },
  {
    question: "3.A woman is going to the cinema with her husband. What time does the movie begin?",
    options: [
      { text: "6:40", isCorrect: true },
      { text: "6:00", isCorrect: false },
      { text: "7:00", isCorrect: false },
    ],
    explanation: "The movie begins at 6:40 according to the original content.",
  },
  {
    question: "4.A man is talking about his eating habits. What time does he usually eat?",
    options: [
      { text: "7 o'clock", isCorrect: true },
      { text: "6 o'clock", isCorrect: false },
      { text: "8 o'clock", isCorrect: false },
    ],
    explanation: "The source indicates he usually eats at 7 o'clock.",
  },
  {
    question: "5.Tom is calling his friend. What time will they meet?",
    options: [
      { text: "7 PM", isCorrect: true },
      { text: "6 PM", isCorrect: false },
      { text: "8 PM", isCorrect: false },
    ],
    explanation: "The meeting time given for Tom and his friend is 7 PM.",
  },
    {
    question: "6.What time should they meet at the library? What time do men and women meet",
    options: [
      { text: "7:45 - quarter to eight", isCorrect: true },
      { text: "8:00", isCorrect: false },
      { text: "7:30", isCorrect: false },
    ],
    explanation: "They agreed to meet at 7:45, which is a quarter to eight.",
  },
  {
    question: "7.Two people are talking about meeting for dinner? What time does Ahmed meet Rose",
    options: [
      { text: "7:45 - quarter to eight", isCorrect: true },
      { text: "8:00", isCorrect: false },
      { text: "7:30", isCorrect: false },
    ],
    explanation: "",
  },
  {
    question: "8.When will Anna meet her friend?",
    options: [
      { text: "9 am on Sunday", isCorrect: true },
      { text: "10 am on Sunday", isCorrect: false },
      { text: "9 am on Saturday", isCorrect: false },
    ],
    explanation: "Anna is going to meet her friend at 9 am on Sunday.",
  },
  {
    question: "9.A man is calling his friend Maria. When will he see her?",
    options: [
      { text: "9 am on Sunday", isCorrect: true },
      { text: "10 am on Sunday", isCorrect: false },
      { text: "9 am on Saturday", isCorrect: false },
    ],
    explanation: "",
  },
  {
    question: "10.Listen to anouncement. When does the train leave the station?",
    options: [
      { text: "9:15", isCorrect: true },
      { text: "9:00", isCorrect: false },
      { text: "9:30", isCorrect: false },
    ],
    explanation: "The announcement says the train leaves at 9:15.",
  },
  {
    question: "11.The train was delayed. What time does the train leave?",
    options: [
      { text: "9:30", isCorrect: true },
      { text: "9:00", isCorrect: false },
      { text: "10:00", isCorrect: false },
    ],
    explanation: "After the delay, the new departure time is 9:30.",
  },
  {
    question: "12.Listen to a man talking about their train journey. What time did the train depart?",
    options: [
      { text: "9:40", isCorrect: false },
      { text: "9:30", isCorrect: true },
      { text: "10:00", isCorrect: false },
    ],
    explanation: "The man mentions that the train departed at 9:40.",
  },
  {
    question: "13.Samia is going to meet her friend. What time are they going to meet?",
    options: [
      { text: "10:00", isCorrect: true },
      { text: "9:30", isCorrect: false },
      { text: "10:30", isCorrect: false },
    ],
    explanation: "The meeting time mentioned is 10:00.",
  },
  {
    question: "14.A woman is talking to her coworker. When does the meeting start?",
    options: [
      { text: "10:15", isCorrect: true },
      { text: "10:00", isCorrect: false },
      { text: "10:30", isCorrect: false },
    ],
    explanation: "According to the dialogue, the meeting starts at 10:15.",
  },
  //===============================================================================================================================
    {
    question: "15.A man is calling his colleague about a meeting with clients. When will the meeting start?",
    options: [
      { text: "10:15", isCorrect: true },
      { text: "10:00", isCorrect: false },
      { text: "10:30", isCorrect: false },
    ],
    explanation: "The meeting with clients starts at 1 pm.",
  },
  {
    question: "16.Jorge is calling his friend about their plan for the weekend. What time does the football match start?",
    options: [
      { text: "1 pm", isCorrect: true },
      { text: "12 pm", isCorrect: false },
      { text: "2 pm", isCorrect: false },
    ],
    explanation: "The football match starts at 1 pm according to their plan.",
  },
  {
    question: "17.A woman is calling her husband. What time will the lunch be ready?",
    options: [
      { text: "2 pm", isCorrect: true },
      { text: "1 pm", isCorrect: false },
      { text: "3 pm", isCorrect: false },
    ],
    explanation: "Lunch will be ready at 2 pm.",
  },
  {
    question: "18.What time is the meeting?",
    options: [
      { text: "2 pm", isCorrect: true },
      { text: "1 pm", isCorrect: false },
      { text: "3 pm", isCorrect: false },
    ],
    explanation: "Lunch will be ready at 2 pm.",
  },
  {
    question: "19.A woman is calling her son. What time will the mother meet the son?",
    options: [
      { text: "3 o'clock", isCorrect: true },
      { text: "2:30", isCorrect: false },
      { text: "4 o'clock", isCorrect: false },
    ],
    explanation: "She will meet her son at 3 o'clock.",
  },
  {
    question: "20.Listening to Sarah leaving a message for her friend. When does she want to meet?",
    options: [
      { text: "3 o'clock", isCorrect: true },
      { text: "2 o'clock", isCorrect: false },
      { text: "4 o'clock", isCorrect: false },
    ],
    explanation: "Sarah wants to meet at 3 o'clock as mentioned in her message.",
  },
  {
    question: "21.A man is calling his mother. How long will he be late?",
    options: [
      { text: "10 minutes", isCorrect: true },
      { text: "15 minutes", isCorrect: false },
      { text: "5 minutes", isCorrect: false },
    ],
    explanation: "He will be 10 minutes late.",
  },
  {
    question: "22.Listen to David talking about the conference. How long did the talk in the speech last?",
    options: [
      { text: "15 minutes", isCorrect: true },
      { text: "10 minutes", isCorrect: false },
      { text: "20 minutes", isCorrect: false },
    ],
    explanation: "David said the talk lasted for 15 minutes.",
  },
  {
    question: "23.The woman is calling a friend about meeting for dinner. How long does it take to get to the station?",
    options: [
      { text: "20 minutes", isCorrect: true },
      { text: "15 minutes", isCorrect: false },
      { text: "25 minutes", isCorrect: false },
    ],
    explanation: "It takes about 20 minutes to get to the station.",
  },
  {
    question: "24.the woman is discussing her new exercise routine. How much time does she spend cycling?",
    options: [
      { text: "35 minutes", isCorrect: true },
      { text: "30 minutes", isCorrect: false },
      { text: "40 minutes", isCorrect: false },
    ],
    explanation: "",
  },
  {
    question: "25.How long was John in India?",
    options: [
      { text: "2 weeks", isCorrect: true },
      { text: "10 days", isCorrect: false },
      { text: "3 weeks", isCorrect: false },
    ],
    explanation: "John stayed in India for 2 weeks.",
  },
  {
    question: "26.Nate is on the phone with his friend. How long does Nate stay in India?",
    options: [
      { text: "2 weeks", isCorrect: true },
      { text: "10 days", isCorrect: false },
      { text: "1 week", isCorrect: false },
    ],
    explanation: "Nate says he stayed in India for 2 weeks.",
  },
    {
    question: "27.Listening to a tour guide talking about Rock city. How old is the city?",
    options: [
      { text: "1500 years", isCorrect: true },
      { text: "1000 years", isCorrect: false },
      { text: "2000 years", isCorrect: false },
    ],
    explanation: "The guide says Rock city is 1500 years old.",
  },
  {
    question: "28.Listen to a nutrition expert. What time is the best for children to eat fruit?",
    options: [
      { text: "In the morning", isCorrect: true },
      { text: "At noon", isCorrect: false },
      { text: "In the evening", isCorrect: false },
    ],
    explanation: "The nutrition expert recommends eating fruit in the morning.",
  },
  {
    question: "29.An author is talking about her daily routine. When does she usually write?",
    options: [
      { text: "In the afternoons", isCorrect: true },
      { text: "In the mornings", isCorrect: false },
      { text: "At night", isCorrect: false },
    ],
    explanation: "The author usually writes in the afternoons.",
  },
  {
    question: "30.Two colleagues talk about meeting. When do they want to meet?",
    options: [
      { text: "On Tuesday", isCorrect: true },
      { text: "On Monday", isCorrect: false },
      { text: "On Wednesday", isCorrect: false },
    ],
    explanation: "They want to meet on Tuesday.",
  },
  {
    question: "31.When do they play football?",
    options: [
      { text: "Wednesday afternoon", isCorrect: true },
      { text: "Tuesday afternoon", isCorrect: false },
      { text: "Thursday morning", isCorrect: false },
    ],
    explanation: "The football game is played on Wednesday afternoon.",
  },
  {
    question: "32.Listen to the speaker talking about their weekly schedule. When is the meeting scheduled?",
    options: [
      { text: "Wednesday afternoon", isCorrect: true },
      { text: "Thursday morning", isCorrect: false },
      { text: "Tuesday afternoon", isCorrect: false },
    ],
    explanation: "The meeting is scheduled for Wednesday afternoon.",
  },
  {
    question: "33.When do they meet each other?",
    options: [
      { text: "On Thursday morning", isCorrect: true },
      { text: "On Friday morning", isCorrect: false },
      { text: "On Wednesday afternoon", isCorrect: false },
    ],
    explanation: "They meet each other on Thursday morning.",
  },
  {
    question: "34.A man is calling his teacher to meet for the assignment. When is the meeting?",
    options: [
      { text: "On Thursday morning", isCorrect: true },
      { text: "On Wednesday morning", isCorrect: false },
      { text: "On Friday afternoon", isCorrect: false },
    ],
    explanation: "The meeting for the assignment is on Thursday morning.",
  },
  {
    question: "35.Adam is calling his friend. When will he need the computer?",
    options: [
      { text: "Friday", isCorrect: true },
      { text: "Thursday", isCorrect: false },
      { text: "Saturday", isCorrect: false },
    ],
    explanation: "Adam will need the computer on Friday.",
  },
  {
    question: "36.When will he hand in the assignment?",
    options: [
      { text: "On Saturday morning", isCorrect: true },
      { text: "On Friday morning", isCorrect: false },
      { text: "On Sunday morning", isCorrect: false },
    ],
    explanation: "The assignment is due on Saturday morning.",
  },
  {
    question: "37.Julie is asking her professor about the assignment. When is the work due?",
    options: [
      { text: "On Saturday morning", isCorrect: true },
      { text: "On Friday morning", isCorrect: false },
      { text: "On Sunday morning", isCorrect: false },
    ],
    explanation: "The professor says the work is due on Saturday morning.",
  },
  {
    question: "38.Doctor’s office is calling about a change in the appointment. When is the new appointment?",
    options: [
      { text: "Thursday 13th", isCorrect: true },
      { text: "Wednesday 12th", isCorrect: false },
      { text: "Friday 14th", isCorrect: false },
    ],
    explanation: "The doctor’s office rescheduled the appointment to Thursday 13th.",
  },
  //=========================================================================================================================
  ];
  //=======================================================================câu hỏi về số, giá tiền===================================
  const topic2: Question[] = [
  {
    "question": "1.A receptionist is checking the client list of a clinic. How many American clients are there?",
    "options": [
      { "text": "One", "isCorrect": true },
      { "text": "Two", "isCorrect": false },
      { "text": "Three", "isCorrect": false }
    ],
    "explanation": "There is one American client in the clinic list."
  },
  {
    "question": "2.Which platform do you need to take if you want to travel to Edinburgh?",
    "options": [
      { "text": "Platform 2 / two", "isCorrect": true },
      { "text": "Platform 1 / one", "isCorrect": false },
      { "text": "Platform 3 / three", "isCorrect": false }
    ],
    "explanation": "The train to Edinburgh departs from Platform 2."
  },
  {
    "question": "3.listen to announcement. which platform to wait for the train",
    "options": [
      { "text": "Platform 2 / two", "isCorrect": true },
      { "text": "Platform 1 / one", "isCorrect": false },
      { "text": "Platform 3 / three", "isCorrect": false }
    ],
    "explanation": ""
  },
  {
    "question": "4.A customer is calling the hotline of a department store. Which number to press in order to buy a computer?",
    "options": [
      { "text": "Three", "isCorrect": true },
      { "text": "One", "isCorrect": false },
      { "text": "Two", "isCorrect": false }
    ],
    "explanation": "Press 3 to reach the computer sales department."
  },
  {
    "question": "5.How many pages of the assignment?",
    "options": [
      { "text": "4", "isCorrect": true },
      { "text": "3", "isCorrect": false },
      { "text": "5", "isCorrect": false }
    ],
    "explanation": "The assignment contains 4 pages."
  },
  {
    "question": "6.A woman is discussing with her team. How many chairs does she need?",
    "options": [
      { "text": "20", "isCorrect": true },
      { "text": "15", "isCorrect": false },
      { "text": "25", "isCorrect": false }
    ],
    "explanation": "She needs 20 chairs for her team."
  },
  {
    "question": "7.Stephanie is looking for a job taking care of children. How old is she?",
    "options": [
      { "text": "21", "isCorrect": true },
      { "text": "20", "isCorrect": false },
      { "text": "22", "isCorrect": false }
    ],
    "explanation": "Stephanie is 21 years old."
  },
  {
    "question": "8.a women is talking about her babysitter. how old is babysitter?",
    "options": [
      { "text": "21", "isCorrect": true },
      { "text": "20", "isCorrect": false },
      { "text": "22", "isCorrect": false }
    ],
    "explanation": ""
  },
  {
    "question": "9.How many buildings will the town have?",
    "options": [
      { "text": "2000", "isCorrect": true },
      { "text": "1000", "isCorrect": false },
      { "text": "3000", "isCorrect": false }
    ],
    "explanation": "The town will have 2000 buildings."
  },
  {
    "question": "10.a man is reading the news about the housing development plan. how many new house are going to be built?",
    "options": [
      { "text": "2000", "isCorrect": true },
      { "text": "1000", "isCorrect": false },
      { "text": "3000", "isCorrect": false }
    ],
    "explanation": ""
  },
  {
    "question": "11.What is the population of this village?",
    "options": [
      { "text": "10,000", "isCorrect": true },
      { "text": "5,000", "isCorrect": false },
      { "text": "20,000", "isCorrect": false }
    ],
    "explanation": "The village has a population of 10,000."
  },
  {
    "question": "12.a tour guide is introducing a tourist destination. how many people live in the town?",
    "options": [
      { "text": "10,000", "isCorrect": true },
      { "text": "5,000", "isCorrect": false },
      { "text": "20,000", "isCorrect": false }
    ],
    "explanation": ""
  },
  {
    "question": "13.What is the phone number of the store? (0080...)",
    "options": [
      { "text": "20 10 30", "isCorrect": true },
      { "text": "20 11 31", "isCorrect": false },
      { "text": "21 10 30", "isCorrect": false }
    ],
    "explanation": "The store’s phone number is 0080 20 10 30."
  },
  {
    "question": "14.a man call the teleshop. what is the teleshop number",
    "options": [
      { "text": "20 10 30", "isCorrect": true },
      { "text": "20 11 31", "isCorrect": false },
      { "text": "21 10 30", "isCorrect": false }
    ],
    "explanation": ""
  },
  {
    "question": "15.What is Mary’s number?",
    "options": [
      { "text": "555 3920", "isCorrect": true },
      { "text": "555 3910", "isCorrect": false },
      { "text": "555 3921", "isCorrect": false }
    ],
    "explanation": "Mary’s phone number is 555 3920."
  },
  {
    "question": "16.How much are the eggs at the supermarket?",
    "options": [
      { "text": "£1.50", "isCorrect": true },
      { "text": "£2.00", "isCorrect": false },
      { "text": "£1.20", "isCorrect": false }
    ],
    "explanation": "The eggs at the supermarket cost £1.50."
  },
  {
    "question": "17.A mom is calling her son to remind him about picking up groceries. How much is an egg?",
    "options": [
      { "text": "£1.50", "isCorrect": true },
      { "text": "£2.00", "isCorrect": false },
      { "text": "£1.20", "isCorrect": false }
    ],
    "explanation": "Each egg costs £1.50."
  },
  {
    "question": "18.How much are the eggs?",
    "options": [
      { "text": "2.50 pounds", "isCorrect": true },
      { "text": "2 pounds", "isCorrect": false },
      { "text": "3 pounds", "isCorrect": false }
    ],
    "explanation": "The eggs cost 2.50 pounds."
  },
  {
    "question": "19.The woman is walking into a local store. How much are the cleaning products?",
    "options": [
      { "text": "One pound fifty (£1.50)", "isCorrect": true },
      { "text": "Two pounds", "isCorrect": false },
      { "text": "One pound", "isCorrect": false }
    ],
    "explanation": "The cleaning products cost one pound fifty (£1.50)."
  },
  {
    "question": "20.Lalia is talking to her friend about her upcoming trip. How much does she think the bus fare will be?",
    "options": [
      { "text": "2.5$", "isCorrect": true },
      { "text": "2$", "isCorrect": false },
      { "text": "3$", "isCorrect": false }
    ],
    "explanation": "Lalia thinks the bus fare will be $2.5."
  },
  {
    "question": "21.How much is the coffee?",
    "options": [
      { "text": "$4.99", "isCorrect": true },
      { "text": "$3.99", "isCorrect": false },
      { "text": "$5.50", "isCorrect": false }
    ],
    "explanation": "The coffee costs $4.99."
  },
  {
    "question": "22.Listen to a friend talking about selling her music player. How much is the music player?",
    "options": [
      { "text": "50$ (dollars)", "isCorrect": true },
      { "text": "40$", "isCorrect": false },
      { "text": "60$", "isCorrect": false }
    ],
    "explanation": "The music player costs 50 dollars."
  },
  {
    "question": "23.A salesperson is talking to her customer. How much is the cheapest computer in the shop?",
    "options": [
      { "text": "135 pounds", "isCorrect": true },
      { "text": "150 pounds", "isCorrect": false },
      { "text": "120 pounds", "isCorrect": false }
    ],
    "explanation": "The cheapest computer in the shop costs 135 pounds."
  },
  {
    "question": "24.Max is calling his friend. How much can Max pay for the computer?",
    "options": [
      { "text": "250 pounds", "isCorrect": true },
      { "text": "200 pounds", "isCorrect": false },
      { "text": "300 pounds", "isCorrect": false }
    ],
    "explanation": "Max can pay 250 pounds for the computer."
  },
  {
    "question": "25.Listen to a woman asking about a flight. How much does the flight in the morning cost?",
    "options": [
      { "text": "350 pounds", "isCorrect": true },
      { "text": "300 pounds", "isCorrect": false },
      { "text": "400 pounds", "isCorrect": false }
    ],
    "explanation": "The morning flight costs 350 pounds."
  },
  {
    "question": "26.A person calls a friend about his new car. What is the price of the small car?",
    "options": [
      { "text": "£3250", "isCorrect": true },
      { "text": "£3000", "isCorrect": false },
      { "text": "£3500", "isCorrect": false }
    ],
    "explanation": "The small car costs £3250."
  },
  {
    "question": "27.Listen to the director talking about sales of his company. How many copies of Freeze Frame magazine were sold?",
    "options": [
      { "text": "Over 300,000 copies", "isCorrect": true },
      { "text": "200,000 copies", "isCorrect": false },
      { "text": "250,000 copies", "isCorrect": false }
    ],
    "explanation": "Over 300,000 copies of Freeze Frame magazine were sold."
  }

  ];
//===============================================================================================chủ đề câu hỏi địa điểm===============================

  const topic3: Question[] = [
  {
    "question": "1.Which room will they study in?",
    "options": [
      { "text": "Room 301", "isCorrect": true },
      { "text": "Room 201", "isCorrect": false },
      { "text": "Room 302", "isCorrect": false }
    ],
    "explanation": "They will study in Room 301."
  },
  {
    "question": "2.Where will the first lesson of computer science take place?",
    "options": [
      { "text": "Room 301", "isCorrect": true },
      { "text": "Room 201", "isCorrect": false },
      { "text": "Room 302", "isCorrect": false }
    ],
    "explanation": "The first computer science lesson will take place in Room 301."
  },
  {
    "question": "3.Where is the main office?",
    "options": [
      { "text": "On the first floor", "isCorrect": true },
      { "text": "On the second floor", "isCorrect": false },
      { "text": "On the ground floor", "isCorrect": false }
    ],
    "explanation": "The main office is on the first floor."
  },
  {
    "question": "4.A man is giving directions to a friend about how to get to the football club. The football club is near:",
    "options": [
      { "text": "A park", "isCorrect": true },
      { "text": "A school", "isCorrect": false },
      { "text": "A library", "isCorrect": false }
    ],
    "explanation": "The football club is near a park."
  },
  {
    "question": "5.A woman is talking about shopping places. Where is she going to go shopping?",
    "options": [
      { "text": "At a new shopping center", "isCorrect": true },
      { "text": "At an old shopping center", "isCorrect": false },
      { "text": "At the local market", "isCorrect": false }
    ],
    "explanation": "She is going to shop at a new shopping center."
  },
  {
    "question": "6.Where does she like to buy things?",
    "options": [
      { "text": "At a new shopping mall", "isCorrect": true },
      { "text": "At a supermarket", "isCorrect": false },
      { "text": "At a grocery store", "isCorrect": false }
    ],
    "explanation": "She likes to buy things at a new shopping mall."
  },
  {
    "question": "7.A man is calling his sister. Where are they going to meet?",
    "options": [
      { "text": "At the park", "isCorrect": true },
      { "text": "At the cafe", "isCorrect": false },
      { "text": "At the library", "isCorrect": false }
    ],
    "explanation": "They are going to meet at the park."
  },
  {
    "question": "8.A man is calling his friend. Where will they meet?",
    "options": [
      { "text": "By the park", "isCorrect": true },
      { "text": "At the station", "isCorrect": false },
      { "text": "At the school", "isCorrect": false }
    ],
    "explanation": "They will meet by the park."
  },
  {
    "question": "9.Where is the football club?",
    "options": [
      { "text": "Near a park", "isCorrect": true },
      { "text": "Next to a hotel", "isCorrect": false },
      { "text": "Across from the school", "isCorrect": false }
    ],
    "explanation": "The football club is near a park."
  },
  {
    "question": "10.Where do they go when they travel to India?",
    "options": [
      { "text": "Go to the park", "isCorrect": true },
      { "text": "Go to the temple", "isCorrect": false },
      { "text": "Go to the hotel", "isCorrect": false }
    ],
    "explanation": "They go to the park when they travel to India."
  },
  {
    "question": "11.Dan is going to university. Where should Dan turn right?",
    "options": [
      { "text": "At traffic lights", "isCorrect": true },
      { "text": "At the corner", "isCorrect": false },
      { "text": "At the bus stop", "isCorrect": false }
    ],
    "explanation": "Dan should turn right at the traffic lights."
  },
  {
    "question": "12.A tour guide is talking about the group's traveling schedule. Where will the group wait for the bus?",
    "options": [
      { "text": "By the hotel's main entrance", "isCorrect": true },
      { "text": "At the station", "isCorrect": false },
      { "text": "Near the park", "isCorrect": false }
    ],
    "explanation": "The group will wait for the bus by the hotel's main entrance."
  },
  {
    "question": "13.listening to a woman anouncement. where will they wait for the bus?",
    "options": [
      { "text": "By the hotel's main entrance", "isCorrect": true },
      { "text": "At the station", "isCorrect": false },
      { "text": "Near the park", "isCorrect": false }
    ],
    "explanation": ""
  },
  {
    "question": "14.Where",
    "options": [
      { "text": "By the hotel", "isCorrect": true },
      { "text": "At the corner", "isCorrect": false },
      { "text": "Near the restaurant", "isCorrect": false }
    ],
    "explanation": ""
  },
  //=================================================================================
  {
    "question": "15.A man is talking about his job. Where is he working now?",
    "options": [
      { "text": "In a bank", "isCorrect": true },
      { "text": "In a hotel", "isCorrect": false },
      { "text": "In a restaurant", "isCorrect": false }
    ],
    "explanation": "He is working in a bank."
  },
  {
    "question": "16.A teacher is talking to her students. Where are the students now?",
    "options": [
      { "text": "In a townhouse", "isCorrect": true },
      { "text": "In a classroom", "isCorrect": false },
      { "text": "In the library", "isCorrect": false }
    ],
    "explanation": "The students are in a townhouse."
  },
  {
    "question": "17.Where did she go for the holiday?",
    "options": [
      { "text": "The south", "isCorrect": true },
      { "text": "The north", "isCorrect": false },
      { "text": "The west", "isCorrect": false }
    ],
    "explanation": "She went to the south for the holiday."
  },
  {
    "question": "18.Listen to the woman talking about her holiday plans. Where is she going next?",
    "options": [
      { "text": "The south", "isCorrect": true },
      { "text": "The east", "isCorrect": false },
      { "text": "The west", "isCorrect": false }
    ],
    "explanation": "She is going to the south next."
  },
  {
    "question": "19.Listen to a weather forecast. Where will the weather be best?",
    "options": [
      { "text": "In the East", "isCorrect": true },
      { "text": "In the North", "isCorrect": false },
      { "text": "In the South", "isCorrect": false }
    ],
    "explanation": "The weather will be best in the East."
  },
  {
    "question": "20.A man is calling his friend to meet for coffee. Where is the coffee shop located?",
    "options": [
      { "text": "Opposite the gift shop", "isCorrect": true },
      { "text": "Next to the hotel", "isCorrect": false },
      { "text": "Behind the bank", "isCorrect": false }
    ],
    "explanation": "The coffee shop is opposite the gift shop."
  },
  {
    "question": "21.Where is the colleague’s office?",
    "options": [
      { "text": "Opposite the hotel", "isCorrect": true },
      { "text": "Next to the bank", "isCorrect": false },
      { "text": "Behind the restaurant", "isCorrect": false }
    ],
    "explanation": "The colleague’s office is opposite the hotel."
  },
  {
    "question": "22.Where is the girl's office?",
    "options": [
      { "text": "Opposite the hotel", "isCorrect": true },
      { "text": "Next to the park", "isCorrect": false },
      { "text": "Across the river", "isCorrect": false }
    ],
    "explanation": "The girl’s office is opposite the hotel."
  },
  {
    "question": "23.listen to a tour guide. Where is the office located?",
    "options": [
      { "text": "Opposite the hotel", "isCorrect": true },
      { "text": "By the river", "isCorrect": false },
      { "text": "Near the station", "isCorrect": false }
    ],
    "explanation": "The office is located opposite the hotel."
  },
  {
    "question": "24.Listen to a tour guide introducing the tour. Where will tea be served?",
    "options": [
      { "text": "On the river boat", "isCorrect": true },
      { "text": "At the hotel", "isCorrect": false },
      { "text": "In the restaurant", "isCorrect": false }
    ],
    "explanation": "Tea will be served on the river boat."
  },
  {
    "question": "25.A woman is talking about her holiday plan. Where is she going on holidays?",
    "options": [
      { "text": "Mountains", "isCorrect": true },
      { "text": "Beach", "isCorrect": false },
      { "text": "Countryside", "isCorrect": false }
    ],
    "explanation": "She is going to the mountains for her holidays."
  },
  {
    "question": "26.Louis is calling his friend Standar. Where will Louis meet Standar?",
    "options": [
      { "text": "Outside the station", "isCorrect": true },
      { "text": "In front of the hotel", "isCorrect": false },
      { "text": "At the park", "isCorrect": false }
    ],
    "explanation": "Louis will meet Standar outside the station."
  },
  {
    "question": "27.where did the couple meet?",
    "options": [
      { "text": "Outside the station", "isCorrect": true },
      { "text": "In front of the hotel", "isCorrect": false },
      { "text": "At the park", "isCorrect": false }
    ],
    "explanation": ""
  },
//==============================================================================================

  {
    "question": "28.Where will they meet to take a bus home?",
    "options": [
      { "text": "At the Marketplace", "isCorrect": true },
      { "text": "At the station", "isCorrect": false },
      { "text": "At the park", "isCorrect": false }
    ],
    "explanation": "They will meet at the marketplace to take a bus home."
  },
  {
    "question": "29.Anna is calling her friend. Where will they meet?",
    "options": [
      { "text": "At the Marketplace", "isCorrect": true },
      { "text": "At the station", "isCorrect": false },
      { "text": "At the park", "isCorrect": false }
    ],
    "explanation": "Anna and her friend will meet at the marketplace."
  },
  {
    "question": "30.Where will they meet?",
    "options": [
      { "text": "The front entrance", "isCorrect": true },
      { "text": "The back door", "isCorrect": false },
      { "text": "The parking lot", "isCorrect": false }
    ],
    "explanation": "They will meet at the front entrance."
  },
  {
    "question": "31.A man is calling his wife. Where do the couple meet?",
    "options": [
      { "text": "Outside the shop", "isCorrect": true },
      { "text": "At the restaurant", "isCorrect": false },
      { "text": "At home", "isCorrect": false }
    ],
    "explanation": "The couple meet outside the shop."
  },
  {
    "question": "32.Which area is he describing? How is a building complex described?",
    "options": [
      { "text": "A university area", "isCorrect": true },
      { "text": "A business district", "isCorrect": false },
      { "text": "A shopping area", "isCorrect": false }
    ],
    "explanation": "He is describing a university area."
  },
  {
    "question": "33.A man is talking to a group of people. Where are they standing?",
    "options": [
      { "text": "A university area", "isCorrect": true },
      { "text": "A business district", "isCorrect": false },
      { "text": "A shopping area", "isCorrect": false }
    ],
    "explanation": ""
  },
  {
    "question": "34.Where to organize the event?",
    "options": [
      { "text": "Outside", "isCorrect": true },
      { "text": "In the hall", "isCorrect": false },
      { "text": "At the park", "isCorrect": false }
    ],
    "explanation": "The event will be organized outside."
  },
  {
    "question": "35.The man is talking about his key. Where did he find the key?",
    "options": [
      { "text": "In the front door", "isCorrect": true },
      { "text": "In the kitchen", "isCorrect": false },
      { "text": "On the table", "isCorrect": false }
    ],
    "explanation": "He found the key in the front door."
  },
  {
    "question": "36.Listen to a girl calling the cafe. Where did she ask the coffee shop to look for her lost item?",
    "options": [
      { "text": "In the corner", "isCorrect": true },
      { "text": "At the counter", "isCorrect": false },
      { "text": "Near the door", "isCorrect": false }
    ],
    "explanation": "She asked the coffee shop to look in the corner."
  },
  {
    "question": "37.Where does she walk every night?",
    "options": [
      { "text": "The college", "isCorrect": true },
      { "text": "The park", "isCorrect": false },
      { "text": "The street", "isCorrect": false }
    ],
    "explanation": "She walks at the college every night."
  },
  {
    "question": "38.Listen to Anna talking about her routine. Where does Anna go for a walk every morning?",
    "options": [
      { "text": "The college", "isCorrect": true },
      { "text": "The park", "isCorrect": false },
      { "text": "The market", "isCorrect": false }
    ],
    "explanation": "Anna goes for a walk at the college every morning."
  },
  {
    "question": "39.Where does Malik want to go?",
    "options": [
      { "text": "The town hall", "isCorrect": true },
      { "text": "The supermarket", "isCorrect": false },
      { "text": "The train station", "isCorrect": false }
    ],
    "explanation": "Malik wants to go to the town hall."
  },
  {
    "question": "40.Where does the woman meet?",
    "options": [
      { "text": "The town hall", "isCorrect": true },
      { "text": "The supermarket", "isCorrect": false },
      { "text": "The train station", "isCorrect": false }
    ],
    "explanation": "Malik wants to go to the town hall."
  },
  {
    "question": "41.a student is talking about housing. where does he live now?",
    "options": [
      { "text": "The town hall", "isCorrect": true },
      { "text": "The supermarket", "isCorrect": false },
      { "text": "The train station", "isCorrect": false }
    ],
    "explanation": ""
  },
  {
    "question": "42.what advice do they need for decorating? their living room",
    "options": [
      { "text": "where to buy a new table", "isCorrect": true },
      { "text": "The supermarket", "isCorrect": false },
      { "text": "The train station", "isCorrect": false }
    ],
    "explanation": ""
  },
  {
    "question": "43.marry is talking to her friend about her new home. what does she ask her friend about",
    "options": [
      { "text": "where to buy a new table", "isCorrect": true },
      { "text": "The supermarket", "isCorrect": false },
      { "text": "The train station", "isCorrect": false }
    ],
    "explanation": ""
  },
  {
    "question": "44.when does he want to go tommorrow",
    "options": [
      { "text": "the main hall", "isCorrect": true },
      { "text": "The supermarket", "isCorrect": false },
      { "text": "The train station", "isCorrect": false }
    ],
    "explanation": ""
  },
  {
    "question": "45.câu hỏi không xác định",
    "options": [
      { "text": "city", "isCorrect": true },
      { "text": "The supermarket", "isCorrect": false },
      { "text": "The train station", "isCorrect": false }
    ],
    "explanation": ""
  },



  ];
//====================================================================================câu hỏi về hành động=============================
  const topic4: Question[] = [
  {
    "question": "1.What will she do?",
    "options": [
      { "text": "Go for a drive", "isCorrect": true },
      { "text": "Have the meeting without him", "isCorrect": false },
      { "text": "Stay at home", "isCorrect": false }
    ],
    "explanation": "Cô ấy sẽ làm gì?"
  },
  {
    "question": "2.Listen to Marry talking to Jane while waiting for James. What did they decide to do?",
    "options": [
      { "text": "Have the meeting without him", "isCorrect": true },
      { "text": "Go for a drive", "isCorrect": false },
      { "text": "Stay at home", "isCorrect": false }
    ],
    "explanation": "Hãy nghe Marry nói chuyện với Jane trong khi chờ James. Họ đã quyết định làm gì?"
  },
  {
    "question": "3.A teacher and a student are talking about transportation. How does the teacher go to school?",
    "options": [
      { "text": "He walks", "isCorrect": true },
      { "text": "She walks", "isCorrect": false },
      { "text": "He has to drive to work", "isCorrect": false }
    ],
    "explanation": "Một giáo viên và một học sinh đang nói về phương tiện đi lại. Giáo viên đi học bằng cách nào?"
  },
  {
    "question": "4.What means of transportation does she take to school?",
    "options": [
      { "text": "She walks", "isCorrect": true },
      { "text": "He walks", "isCorrect": false },
      { "text": "Exchange a shirt", "isCorrect": false }
    ],
    "explanation": "Cô ấy đi phương tiện gì đến trường?"
  },
  {
    "question": "5.Why did she return to the shop?",
    "options": [
      { "text": "Exchange a shirt", "isCorrect": true },
      { "text": "Go for a drive", "isCorrect": false },
      { "text": "He has to drive to work", "isCorrect": false }
    ],
    "explanation": "Tại sao cô ấy lại quay lại cửa hàng?"
  },
  {
    "question": "6.A man is talking to his friend. Why does he need to learn to drive?",
    "options": [
      { "text": "He has to drive to work", "isCorrect": true },
      { "text": "He walks", "isCorrect": false },
      { "text": "Stay at home", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang nói chuyện với bạn mình. Tại sao anh ấy cần học lái xe?"
  },
  {
    "question": "7.A woman is talking about her weekends. What did she do last week?",
    "options": [
      { "text": "Stayed at home", "isCorrect": true },
      { "text": "He walks", "isCorrect": false },
      { "text": "Exchange a shirt", "isCorrect": false }
    ],
    "explanation": "Một người phụ nữ đang nói về cuối tuần của cô ấy. Tuần trước cô ấy đã làm gì?"
  },
  {
    "question": "8.The game does not let him?",
    "options": [
      { "text": "Win", "isCorrect": true },
      { "text": "To tell her he will be late", "isCorrect": false },
      { "text": "Go for a drive", "isCorrect": false }
    ],
    "explanation": "Trò chơi không cho phép anh ấy?"
  },
  {
    "question": "9.What A call B for?",
    "options": [
      { "text": "To tell her he will be late", "isCorrect": true },
      { "text": "Win", "isCorrect": false },
      { "text": "He walks", "isCorrect": false }
    ],
    "explanation": "A gọi B để làm gì?"
  },
  {
    "question": "10.What career did he choose?",
    "options": [
      { "text": "To work in business", "isCorrect": true },
      { "text": "Missed the train", "isCorrect": false },
      { "text": "Teaching", "isCorrect": false }
    ],
    "explanation": "Anh ấy đã chọn nghề gì?"
  },
  {
    "question": "11.A man is seeking advice on future career. What is he going to do?",
    "options": [
      { "text": "To work in business", "isCorrect": true },
      { "text": "Teaching", "isCorrect": false },
      { "text": "Play golf", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang tìm kiếm lời khuyên về nghề nghiệp tương lai. Anh ấy sẽ làm gì?"
  },
  {
    "question": "12.Listen to a man explaining why he was late. What is the main reason he gets late?",
    "options": [
      { "text": "Missed the train", "isCorrect": true },
      { "text": "To work in business", "isCorrect": false },
      { "text": "Cycling", "isCorrect": false }
    ],
    "explanation": "Hãy nghe một người đàn ông giải thích lý do anh ấy đến muộn. Lý do chính khiến anh ấy đến muộn là gì?"
  },
  {
    "question": "13.What are they going to do on this holiday?",
    "options": [
      { "text": "Teaching", "isCorrect": true },
      { "text": "Play golf", "isCorrect": false },
      { "text": "Go to the park", "isCorrect": false }
    ],
    "explanation": "Họ sẽ làm gì vào kỳ nghỉ này?"
  },
  {
    "question": "14.A tour guide is talking about the vacation list of activities. What can people do in the afternoon?",
    "options": [
      { "text": "Play golf", "isCorrect": true },
      { "text": "Teaching", "isCorrect": false },
      { "text": "Cycling", "isCorrect": false }
    ],
    "explanation": "Một hướng dẫn viên đang nói về danh sách các hoạt động trong kỳ nghỉ. Mọi người có thể làm gì vào buổi chiều?"
  },
  {
    "question": "15.A man is talking about his trip. What did he enjoy last year?",
    "options": [
      { "text": "Cycling", "isCorrect": true },
      { "text": "Play golf", "isCorrect": false },
      { "text": "Camping", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang kể về chuyến đi của anh ấy. Năm ngoái anh ấy đã tận hưởng điều gì?"
  },
  {
    "question": "16.A woman is talking about her family's holidays. What did the family do last year?",
    "options": [
      { "text": "Camping", "isCorrect": true },
      { "text": "Cycling", "isCorrect": false },
      { "text": "Go to the park", "isCorrect": false }
    ],
    "explanation": "Một người phụ nữ đang nói về kỳ nghỉ của gia đình cô ấy. Gia đình đã làm gì vào năm ngoái?"
  },
  {
    "question": "17.What did the woman do on her holiday?",
    "options": [
      { "text": "Go to the park", "isCorrect": true },
      { "text": "Camping", "isCorrect": false },
      { "text": "They stay together in groups for protection", "isCorrect": false }
    ],
    "explanation": "Người phụ nữ đã làm gì vào kỳ nghỉ của mình?"
  },
  {
    "question": "18.A tour guide is talking about birds' behaviors. What do birds do in the winter?",
    "options": [
      { "text": "They stay together in groups for protection", "isCorrect": true },
      { "text": "Go to the park", "isCorrect": false },
      { "text": "Speak at a conference", "isCorrect": false }
    ],
    "explanation": "Một hướng dẫn viên du lịch đang nói về hành vi của loài chim. Chim làm gì vào mùa đông?"
  },
  {
    "question": "19.A professor is talking to his student. What does the professor ask his student to do?",
    "options": [
      { "text": "Speak at a conference", "isCorrect": true },
      { "text": "They stay together in groups for protection", "isCorrect": false },
      { "text": "To work in business", "isCorrect": false }
    ],
    "explanation": "Một giáo sư đang nói chuyện với sinh viên của mình. Giáo sư yêu cầu sinh viên làm gì?"
  },
  {
    "question": "20.A man is talking about his routine after work. What is the man going to do after work?",
    "options": [
      { "text": "Goes running", "isCorrect": true },
      { "text": "Play football", "isCorrect": false },
      { "text": "Go for a walk", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang nói về thói quen của mình sau giờ làm việc. Người đàn ông sẽ làm gì sau giờ làm việc?"
  },
  {
    "question": "21.What does he do after work?",
    "options": [
      { "text": "Play football", "isCorrect": true },
      { "text": "Goes running", "isCorrect": false },
      { "text": "To have some quiet time", "isCorrect": false }
    ],
    "explanation": "Anh ấy làm gì sau giờ làm việc?"
  },
  {
    "question": "22.Two friends are talking about their school days. What was the woman good at?",
    "options": [
      { "text": "Go for a walk", "isCorrect": true },
      { "text": "Play football", "isCorrect": false },
      { "text": "Goes running", "isCorrect": false }
    ],
    "explanation": "Hai người bạn đang kể về thời đi học của họ. Người phụ nữ giỏi gì?"
  },
  {
    "question": "23.A woman is talking about her family's weekend. What does the family do most weekends?",
    "options": [
      { "text": "Goes for a walk", "isCorrect": true },
      { "text": "Play football", "isCorrect": false },
      { "text": "To have some quiet time", "isCorrect": false }
    ],
    "explanation": "Một người phụ nữ đang nói về cuối tuần của gia đình cô ấy. Gia đình làm gì nhiều nhất vào cuối tuần?"
  },
  {
    "question": "24.Lily is talking about her daily routine. What does she do in the evening?",
    "options": [
      { "text": "Goes for a walk", "isCorrect": true },
      { "text": "Goes running", "isCorrect": false },
      { "text": "To have some quiet time", "isCorrect": false }
    ],
    "explanation": "Lily đang nói về thói quen hàng ngày của cô ấy. Cô ấy làm gì vào buổi tối?"
  },
  {
    "question": "25.A woman is talking about her plan for the holiday. What will she do during the holiday?",
    "options": [
      { "text": "Go for a walk", "isCorrect": true },
      { "text": "Play football", "isCorrect": false },
      { "text": "To have some quiet time", "isCorrect": false }
    ],
    "explanation": "Một người phụ nữ đang nói về kế hoạch cho kỳ nghỉ của mình. Cô ấy sẽ làm gì trong kỳ nghỉ?"
  },
  {
    "question": "26.Listen to a woman explaining her morning routine to her friend. Why do women get up early?",
    "options": [
      { "text": "To have some quiet time", "isCorrect": true },
      { "text": "Go for a walk", "isCorrect": false },
      { "text": "Goes running", "isCorrect": false }
    ],
    "explanation": "Hãy nghe một người phụ nữ giải thích thói quen buổi sáng của cô ấy cho bạn của cô ấy. Tại sao phụ nữ dậy sớm?"
  },
  {
    "question": "27.Why the mother cannot pick up the son/daughter?",
    "options": [
      { "text": "Stay late at the office", "isCorrect": true },
      { "text": "He taught her a lot", "isCorrect": false },
      { "text": "Drawing", "isCorrect": false }
    ],
    "explanation": "Tại sao người mẹ không thể đón con trai/con gái?"
  },
  {
    "question": "28.Anna is calling her brother Max. What does Anna do later in the afternoon?",
    "options": [
      { "text": "Stay late at the office", "isCorrect": true },
      { "text": "Seeing her family", "isCorrect": false },
      { "text": "Swimming in the sea", "isCorrect": false }
    ],
    "explanation": "Anna đang gọi anh trai cô ấy là Max. Anna làm gì vào buổi chiều?"
  },
  {
    "question": "29.Listen to Anna talk about her old manager, George. What did Anna say about George?",
    "options": [
      { "text": "He taught her a lot", "isCorrect": true },
      { "text": "Stay late at the office", "isCorrect": false },
      { "text": "Drawing", "isCorrect": false }
    ],
    "explanation": "Nghe Anna kể về người quản lý cũ của cô ấy, George. Anna nói gì về George?"
  },
  {
    "question": "30.Listen to an actor discussing his hobbies. What does the actor like to do in his free time?",
    "options": [
      { "text": "Drawing", "isCorrect": true },
      { "text": "He taught her a lot", "isCorrect": false },
      { "text": "Seeing her family", "isCorrect": false }
    ],
    "explanation": "Nghe một diễn viên thảo luận về sở thích của anh ấy. Diễn viên thích làm gì khi rảnh rỗi?"
  },
  {
    "question": "31.A woman is talking about her usual Saturday routine. What does she usually do on Saturdays?",
    "options": [
      { "text": "Seeing her family", "isCorrect": true },
      { "text": "Drawing", "isCorrect": false },
      { "text": "Swimming in the sea", "isCorrect": false }
    ],
    "explanation": "Một người phụ nữ đang nói về thói quen thường ngày vào thứ Bảy của mình. Cô ấy thường làm gì vào thứ Bảy?"
  },
  {
    "question": "32.What does the man enjoy on his vacation?",
    "options": [
      { "text": "Swimming in the sea", "isCorrect": true },
      { "text": "Seeing her family", "isCorrect": false },
      { "text": "Suggest a drink", "isCorrect": false }
    ],
    "explanation": "Người đàn ông thích gì vào kỳ nghỉ của mình?"
  },
  {
    "question": "33.Vincent is calling James. Why does Vincent call James?",
    "options": [
      { "text": "Suggest a drink", "isCorrect": true },
      { "text": "Swimming in the sea", "isCorrect": false },
      { "text": "Cook for yourself", "isCorrect": false }
    ],
    "explanation": "Vincent gọi James. Vincent gọi James để làm gì?"
  },
  {
    "question": "34.What does he advice young people to do to save money?",
    "options": [
      { "text": "Cook for yourself", "isCorrect": true },
      { "text": "Suggest a drink", "isCorrect": false },
      { "text": "Walking", "isCorrect": false }
    ],
    "explanation": "Anh ấy khuyên các bạn trẻ nên làm gì để tiết kiệm tiền?"
  },
  {
    "question": "35.What is her financial advice to save money?",
    "options": [
      { "text": "Cook for yourself", "isCorrect": true },
      { "text": "Suggest a drink", "isCorrect": false },
      { "text": "Walking", "isCorrect": false }
    ],
    "explanation": "Lời khuyên tài chính của bà ấy để tiết kiệm tiền là gì?"
  },
  {
    "question": "36.What is she going to do? / What is the way to exercise? / What does she do on her holidays?",
    "options": [
      { "text": "Walking", "isCorrect": true },
      { "text": "Cook for yourself", "isCorrect": false },
      { "text": "Adjust the schedule", "isCorrect": false }
    ],
    "explanation": "Cô ấy sẽ làm gì? / Cách tập thể dục là gì? / Cô ấy làm gì vào kỳ nghỉ?"
  },
  {
    "question": "37.What’s the main change managers are going to do?",
    "options": [
      { "text": "Adjust the schedule", "isCorrect": true },
      { "text": "Walking", "isCorrect": false },
      { "text": "Cook for yourself", "isCorrect": false }
    ],
    "explanation": "Những người quản lý thay đổi chính sẽ làm gì?"
  },
  {
    "question": "38.A man wants to buy a new house. What is his biggest problem?",
    "options": [
      { "text": "Persuading his family", "isCorrect": true },
      { "text": "Make plans later", "isCorrect": false },
      { "text": "Measure the speed of the plant growth", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông muốn mua một ngôi nhà mới. Vấn đề lớn nhất của anh ấy là gì?"
  },
  {
    "question": "39.A man and woman are discussing their plans for the evening. What do the man and woman decide to do in the evening?",
    "options": [
      { "text": "Make plans later", "isCorrect": true },
      { "text": "Persuading his family", "isCorrect": false },
      { "text": "Go to theater and play sports", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông và người phụ nữ đang thảo luận về kế hoạch buổi tối. Người đàn ông và người phụ nữ quyết định làm gì vào buổi tối?"
  },
  {
    "question": "40.Why did the students do the experiment on the tree?",
    "options": [
      { "text": "Measure the speed of the plant growth", "isCorrect": true },
      { "text": "Make plans later", "isCorrect": false },
      { "text": "Going to the theater", "isCorrect": false }
    ],
    "explanation": "Tại sao học sinh làm thí nghiệm trên cây?"
  },
  {
    "question": "41.Listen to Sarah talking about her hobby. What does she do in her free time?",
    "options": [
      { "text": "Go to theater and play sports", "isCorrect": true },
      { "text": "Measure the speed of the plant growth", "isCorrect": false },
      { "text": "Order the food", "isCorrect": false }
    ],
    "explanation": "Hãy nghe Sarah nói về sở thích của cô ấy. Cô ấy làm gì vào thời gian rảnh?"
  },
  {
    "question": "42.Two friends are talking about their favorite activities. What is the woman’s favorite form of entertainment?",
    "options": [
      { "text": "Going to the theater", "isCorrect": true },
      { "text": "Go to theater and play sports", "isCorrect": false },
      { "text": "Request a transfer", "isCorrect": false }
    ],
    "explanation": "Hai người bạn đang nói về hoạt động yêu thích của họ. Hình thức giải trí yêu thích của người phụ nữ là gì?"
  },
  {
    "question": "43.Listen to a teacher talking about meeting preparations. What is the teacher preparing for the meeting now?",
    "options": [
      { "text": "Order the food", "isCorrect": true },
      { "text": "Going to the theater", "isCorrect": false },
      { "text": "Arrange private classes for his son", "isCorrect": false }
    ],
    "explanation": "Nghe giáo viên nói về việc chuẩn bị cho cuộc họp. Bây giờ giáo viên đang chuẩn bị gì cho cuộc họp?"
  },
  {
    "question": "44.An expert is talking about lack of satisfaction at work. What should be the solution?",
    "options": [
      { "text": "Request a transfer", "isCorrect": true },
      { "text": "Order the food", "isCorrect": false },
      { "text": "Have coffee", "isCorrect": false }
    ],
    "explanation": "Một chuyên gia đang nói về sự thiếu hài lòng trong công việc. Giải pháp nên là gì?"
  },
  {
    "question": "45.Listen to a conversation between the teacher and a parent. What will the father do?",
    "options": [
      { "text": "Arrange private classes for his son", "isCorrect": true },
      { "text": "Request a transfer", "isCorrect": false },
      { "text": "Have coffee", "isCorrect": false }
    ],
    "explanation": "Nghe cuộc trò chuyện giữa giáo viên và phụ huynh. Người cha sẽ làm gì?"
  },
  {
    "question": "46.A woman tells her friend about her plans for the day. What is the woman going to do?",
    "options": [
      { "text": "Have coffee", "isCorrect": true },
      { "text": "Arrange private classes for his son", "isCorrect": false },
      { "text": "Persuading his family", "isCorrect": false }
    ],
    "explanation": "Một người phụ nữ kể với bạn mình về kế hoạch trong ngày của cô ấy. Người phụ nữ sẽ làm gì?"
  },
  {
    "question": "47.What is the woman doing?",
    "options": [
      { "text": "Cleaning", "isCorrect": true },
      { "text": "To say thank you", "isCorrect": false },
      { "text": "Look at a view", "isCorrect": false }
    ],
    "explanation": "Người phụ nữ đang làm gì?"
  },
  {
    "question": "48.Listen to the conversation between Douglas and Kay. Why does Douglas call Kay?",
    "options": [
      { "text": "To say thank you", "isCorrect": true },
      { "text": "Cleaning", "isCorrect": false },
      { "text": "Look at a view", "isCorrect": false }
    ],
    "explanation": "Hãy nghe cuộc trò chuyện giữa Douglas và Kay. Tại sao Douglas gọi Kay?"
  },
  {
    "question": "49.What did he do in the morning?",
    "options": [
      { "text": "Look at a view", "isCorrect": true },
      { "text": "To say thank you", "isCorrect": false },
      { "text": "Cleaning", "isCorrect": false }
    ],
    "explanation": "Anh ấy đã làm gì vào buổi sáng?"
  }
  ];
//=======================================================================================chủ đề khác=====================================
  const topic5: Question[] = [
  {
    "question": "1.A woman is talking about her job. How is being a writer different from other jobs?",
    "options": [
      { "text": "She works at irregular hours", "isCorrect": true },
      { "text": "The service is slow", "isCorrect": false },
      { "text": "They were thin", "isCorrect": false }
    ],
    "explanation": "Một người phụ nữ đang nói về công việc của mình. Làm nhà văn khác với các công việc khác như thế nào?"
  },
  {
    "question": "2.Louis is having dinner in a new restaurant. What is his opinion about that restaurant?",
    "options": [
      { "text": "The service is slow", "isCorrect": true },
      { "text": "She works at irregular hours", "isCorrect": false },
      { "text": "They have similar interests", "isCorrect": false }
    ],
    "explanation": "Louis đang ăn tối ở một nhà hàng mới. Ý kiến của anh ấy về nhà hàng đó là gì?"
  },
  {
    "question": "3.James is talking about his family members. In what way does his mother and his aunt alike?",
    "options": [
      { "text": "They were thin", "isCorrect": true },
      { "text": "The service is slow", "isCorrect": false },
      { "text": "He enjoys his job here", "isCorrect": false }
    ],
    "explanation": "James đang nói về các thành viên trong gia đình mình. Mẹ và dì của anh ấy giống nhau ở điểm nào?"
  },
  {
    "question": "Linda is talking about her mother. What do mother and daughter have in common?",
    "options": [
      { "text": "They have similar interests", "isCorrect": true },
      { "text": "They were thin", "isCorrect": false },
      { "text": "They have similar characters", "isCorrect": false }
    ],
    "explanation": "Linda đang nói về mẹ của mình. Mẹ và con gái có điểm gì chung?"
  },
  {
    "question": "Lucy is calling her friend. What is her sister like?",
    "options": [
      { "text": "They have similar characters", "isCorrect": true },
      { "text": "They have similar interests", "isCorrect": false },
      { "text": "By bus", "isCorrect": false }
    ],
    "explanation": "Lucy đang gọi cho bạn mình. Em gái cô ấy như thế nào?"
  },
  {
    "question": "Listening to a man talking about his business trip. What does he like in Dubai?",
    "options": [
      { "text": "He enjoys his job here", "isCorrect": true },
      { "text": "They have similar characters", "isCorrect": false },
      { "text": "By car", "isCorrect": false }
    ],
    "explanation": "Lắng nghe một người đàn ông nói về chuyến công tác của mình. Anh ấy thích gì ở Dubai?"
  },
  {
    "question": "Greg is talking about a working day in his life. How does he go to work?",
    "options": [
      { "text": "By bus", "isCorrect": true },
      { "text": "He enjoys his job here", "isCorrect": false },
      { "text": "By train", "isCorrect": false }
    ],
    "explanation": "Greg đang nói về một ngày làm việc trong cuộc sống của mình. Anh ấy đi làm bằng cách nào?"
  },
  {
    "question": "How does the man usually go to work?",
    "options": [
      { "text": "By car", "isCorrect": true },
      { "text": "By bus", "isCorrect": false },
      { "text": "By train", "isCorrect": false }
    ],
    "explanation": "Người đàn ông thường đi làm bằng cách nào?"
  },
  {
    "question": "A man is talking about his holiday. How is he going to travel to the city?",
    "options": [
      { "text": "By train", "isCorrect": true },
      { "text": "By car", "isCorrect": false },
      { "text": "Favorite country's band / the city's favorite group", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang nói về kỳ nghỉ của mình. Anh ấy sẽ đi đến thành phố bằng cách nào?"
  },
  {
    "question": "A man is talking about the city concert. How will the concert end?",
    "options": [
      { "text": "Favorite country's band / the city's favorite group", "isCorrect": true },
      { "text": "By train", "isCorrect": false },
      { "text": "A surprise performance", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang nói về buổi hòa nhạc ở thành phố. Buổi hòa nhạc sẽ kết thúc như thế nào?"
  },
  {
    "question": "A girl is talking about a show she will attend. What will end with?",
    "options": [
      { "text": "A surprise performance", "isCorrect": true },
      { "text": "Favorite country's band / the city's favorite group", "isCorrect": false },
      { "text": "She works at irregular hours", "isCorrect": false }
    ],
    "explanation": "Một cô gái đang nói về một chương trình cô ấy sẽ tham dự. Chương trình sẽ kết thúc bằng gì?"
  },
  {
    "question": "Tom is talking with his friend about his teachers. Who is his favorite teacher?",
    "options": [
      { "text": "Miss Brown", "isCorrect": true },
      { "text": "The window", "isCorrect": false },
      { "text": "The words", "isCorrect": false }
    ],
    "explanation": "Tom đang nói chuyện với bạn về các giáo viên của mình. Giáo viên yêu thích của cậu ấy là ai?"
  },
  {
    "question": "What do they need to repair for the building?",
    "options": [
      { "text": "The window", "isCorrect": true },
      { "text": "Miss Brown", "isCorrect": false },
      { "text": "Blue", "isCorrect": false }
    ],
    "explanation": "Họ cần sửa gì cho tòa nhà?"
  },
  {
    "question": "A woman is talking about her house. What is she going to change in their house?",
    "options": [
      { "text": "The window", "isCorrect": true },
      { "text": "The words", "isCorrect": false },
      { "text": "Black", "isCorrect": false }
    ],
    "explanation": "Một người phụ nữ đang nói về ngôi nhà của mình. Cô ấy sẽ thay đổi gì trong nhà?"
  },
  {
    "question": "Listen to a radio man talking about a new popular song. Which is the most attractive part of the song?",
    "options": [
      { "text": "The words", "isCorrect": true },
      { "text": "The window", "isCorrect": false },
      { "text": "France", "isCorrect": false }
    ],
    "explanation": "Nghe người dẫn chương trình radio nói về một bài hát mới nổi tiếng. Phần hấp dẫn nhất của bài hát là gì?"
  },
  {
    "question": "Which light shows that the computer is on?",
    "options": [
      { "text": "Blue", "isCorrect": true },
      { "text": "The words", "isCorrect": false },
      { "text": "Black", "isCorrect": false }
    ],
    "explanation": "Đèn nào cho biết máy tính đang bật?"
  },
  {
    "question": "What color shirt does she get?",
    "options": [
      { "text": "Black", "isCorrect": true },
      { "text": "Blue", "isCorrect": false },
      { "text": "Computer", "isCorrect": false }
    ],
    "explanation": "Cô ấy mặc áo sơ mi màu gì?"
  },
  {
    "question": "A man is talking to a shopping assistant. What color top is he going to buy?",
    "options": [
      { "text": "Black", "isCorrect": true },
      { "text": "Blue", "isCorrect": false },
      { "text": "France", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang nói chuyện với nhân viên bán hàng. Anh ấy định mua áo màu gì?"
  },
  {
    "question": "What country will they study in next semester?",
    "options": [
      { "text": "France", "isCorrect": true },
      { "text": "Black", "isCorrect": false },
      { "text": "Computer", "isCorrect": false }
    ],
    "explanation": "Họ sẽ học ở quốc gia nào trong học kỳ tới?"
  },
  {
    "question": "What course did he take?",
    "options": [
      { "text": "Computer", "isCorrect": true },
      { "text": "France", "isCorrect": false },
      { "text": "An electrician", "isCorrect": false }
    ],
    "explanation": "Anh ấy đã học khóa học gì?"
  },
  {
    "question": "Listen to a student talking about his study. What course is the student going to take this year?",
    "options": [
      { "text": "Computer", "isCorrect": true },
      { "text": "An electrician", "isCorrect": false },
      { "text": "History classes", "isCorrect": false }
    ],
    "explanation": "Lắng nghe một sinh viên nói về việc học của mình. Sinh viên sẽ học khóa nào năm nay?"
  },
  {
    "question": "David is in an interview. What was his last job?",
    "options": [
      { "text": "An electrician", "isCorrect": true },
      { "text": "Computer", "isCorrect": false },
      { "text": "History classes", "isCorrect": false }
    ],
    "explanation": "David đang trong một cuộc phỏng vấn. Công việc gần đây nhất của anh ấy là gì?"
  },
  {
    "question": "A man and a woman are talking about their old school days. What was the man’s favorite thing about school?",
    "options": [
      { "text": "History classes", "isCorrect": true },
      { "text": "An electrician", "isCorrect": false },
      { "text": "Miss Brown", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông và một người phụ nữ đang nói về thời đi học cũ của họ. Điều yêu thích nhất của người đàn ông về trường học là gì?"
  },
  {
    "question": "The daughter is calling her father. What did she buy?",
    "options": [
      { "text": "A dress", "isCorrect": true },
      { "text": "A bag", "isCorrect": false },
      { "text": "Glasses", "isCorrect": false }
    ],
    "explanation": "Con gái đang gọi bố. Cô ấy đã mua gì?"
  },
  {
    "question": "A woman is talking to the police. What did she lose?",
    "options": [
      { "text": "A bag", "isCorrect": true },
      { "text": "A dress", "isCorrect": false },
      { "text": "Clothes", "isCorrect": false }
    ],
    "explanation": "Một người phụ nữ đang nói chuyện với cảnh sát. Cô ấy đã mất gì?"
  },
  {
    "question": "What did he leave at a friend's house?",
    "options": [
      { "text": "Glasses", "isCorrect": true },
      { "text": "A bag", "isCorrect": false },
      { "text": "Water", "isCorrect": false }
    ],
    "explanation": "Anh ấy đã để lại gì ở nhà bạn?"
  },
  {
    "question": "A man is talking on the phone. What did the man lose?",
    "options": [
      { "text": "Glasses", "isCorrect": true },
      { "text": "Clothes", "isCorrect": false },
      { "text": "A suit for the office", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang nói chuyện điện thoại. Người đàn ông đã mất gì?"
  },
  {
    "question": "Two friends are talking with each other. What did they both buy?",
    "options": [
      { "text": "Clothes", "isCorrect": true },
      { "text": "Glasses", "isCorrect": false },
      { "text": "The mountain scenes", "isCorrect": false }
    ],
    "explanation": "Hai người bạn đang nói chuyện với nhau. Cả hai đã mua gì?"
  },
  {
    "question": "A man is talking to a shop assistant. What does the man buy in the shop?",
    "options": [
      { "text": "Clothes", "isCorrect": true },
      { "text": "Water", "isCorrect": false },
      { "text": "Eggs", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang nói chuyện với nhân viên bán hàng. Người đàn ông mua gì ở cửa hàng?"
  },
  {
    "question": "Lucy is calling her brother. What does the brother have to drink?",
    "options": [
      { "text": "Water", "isCorrect": true },
      { "text": "Clothes", "isCorrect": false },
      { "text": "A suit for the office", "isCorrect": false }
    ],
    "explanation": "Lucy đang gọi cho anh trai cô ấy. Anh trai uống gì?"
  },
  {
    "question": "A man and a woman are going shopping. What does he buy in the store?",
    "options": [
      { "text": "A suit for the office", "isCorrect": true },
      { "text": "Water", "isCorrect": false },
      { "text": "The mountain scenes", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông và một người phụ nữ đang đi mua sắm. Anh ấy mua gì ở cửa hàng?"
  },
  {
    "question": "A girl is talking about a film. What did she like best about the film?",
    "options": [
      { "text": "The mountain scenes", "isCorrect": true },
      { "text": "A suit for the office", "isCorrect": false },
      { "text": "Eggs", "isCorrect": false }
    ],
    "explanation": "Một cô gái đang nói về một bộ phim. Cô ấy thích nhất điều gì về bộ phim?"
  },
  {
    "question": "What did the mother call her daughter to help her buy?",
    "options": [
      { "text": "Eggs", "isCorrect": true },
      { "text": "The mountain scenes", "isCorrect": false },
      { "text": "Fish", "isCorrect": false }
    ],
    "explanation": "Mẹ gọi con gái nhỏ mua gì?"
  },
  {
    "question": "Anne is calling her daughter Sally. What does Anne need?",
    "options": [
      { "text": "Eggs", "isCorrect": true },
      { "text": "Fish", "isCorrect": false },
      { "text": "A phone", "isCorrect": false }
    ],
    "explanation": "Anne đang gọi con gái mình là Sally. Anne cần gì?"
  },
  {
    "question": "A boy is talking about his cat. What does he feed the cat?",
    "options": [
      { "text": "Fish", "isCorrect": true },
      { "text": "Eggs", "isCorrect": false },
      { "text": "A phone", "isCorrect": false }
    ],
    "explanation": "Một cậu bé đang nói về con mèo của mình. Cậu ấy cho mèo ăn gì?"
  },
  {
    "question": "Alice is calling her friend. What did she lose?",
    "options": [
      { "text": "A phone", "isCorrect": true },
      { "text": "Fish", "isCorrect": false },
      { "text": "A dress", "isCorrect": false }
    ],
    "explanation": "Alice đang gọi cho bạn mình. Cô ấy đã mất gì?"
  },
  {
    "question": "A woman is talking to a police officer. What did she lose?",
    "options": [
      { "text": "Phone", "isCorrect": true },
      { "text": "Chocolate", "isCorrect": false },
      { "text": "Art", "isCorrect": false }
    ],
    "explanation": "Một người phụ nữ đang nói chuyện với cảnh sát. Cô ấy đã mất gì?"
  },
  {
    "question": "Jack is phoning his mom. What does Jack need to buy for his sister?",
    "options": [
      { "text": "Chocolate", "isCorrect": true },
      { "text": "Phone", "isCorrect": false },
      { "text": "Tea", "isCorrect": false }
    ],
    "explanation": "Jack đang gọi cho mẹ. Jack cần mua gì cho em gái?"
  },
  {
    "question": "A mom is talking to her son. What does the son like to study?",
    "options": [
      { "text": "Art", "isCorrect": true },
      { "text": "Chocolate", "isCorrect": false },
      { "text": "Iced tea", "isCorrect": false }
    ],
    "explanation": "Một người mẹ đang nói chuyện với con trai mình. Con trai thích học gì?"
  },
  {
    "question": "What does her sister drink?",
    "options": [
      { "text": "Tea", "isCorrect": true },
      { "text": "Art", "isCorrect": false },
      { "text": "Iced tea", "isCorrect": false }
    ],
    "explanation": "Em gái cô ấy uống gì?"
  },
  {
    "question": "Linda is talking about what she likes to eat. What does she have for lunch?",
    "options": [
      { "text": "Tea", "isCorrect": true },
      { "text": "Iced tea", "isCorrect": false },
      { "text": "The ending", "isCorrect": false }
    ],
    "explanation": "Linda đang nói về những gì cô ấy thích ăn. Cô ấy ăn gì vào bữa trưa?"
  },
  {
    "question": "A man is ordering a drink. What does he want?",
    "options": [
      { "text": "Iced tea", "isCorrect": true },
      { "text": "Tea", "isCorrect": false },
      { "text": "The ending", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang gọi đồ uống. Anh ta muốn gì?"
  },
  {
    "question": "A man is talking to a waiter. What drink does the man choose?",
    "options": [
      { "text": "Iced tea", "isCorrect": true },
      { "text": "The ending", "isCorrect": false },
      { "text": "A large stone", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang nói chuyện với người phục vụ. Người đàn ông chọn đồ uống gì?"
  },
  {
    "question": "What do both people agree on about the book?",
    "options": [
      { "text": "The ending", "isCorrect": true },
      { "text": "Iced tea", "isCorrect": false },
      { "text": "Red", "isCorrect": false }
    ],
    "explanation": "Cả hai người đồng ý về điều gì về cuốn sách?"
  },
  {
    "question": "Two friends are discussing a movie they recently watched. What elements of the film do they agree on?",
    "options": [
      { "text": "The ending", "isCorrect": true },
      { "text": "A large stone", "isCorrect": false },
      { "text": "Red", "isCorrect": false }
    ],
    "explanation": "Hai người bạn đang thảo luận về một bộ phim họ vừa xem. Họ đồng ý về những yếu tố nào của bộ phim?"
  },
  {
    "question": "A woman is talking about her job. What encouraged her to become a scientist?",
    "options": [
      { "text": "A large stone", "isCorrect": true },
      { "text": "The ending", "isCorrect": false },
      { "text": "Red", "isCorrect": false }
    ],
    "explanation": "Một người phụ nữ đang nói về công việc của mình. Điều gì đã khuyến khích cô trở thành nhà khoa học?"
  },
  {
    "question": "Jack is calling to invite a friend to his house. What color is Jack’s house?",
    "options": [
      { "text": "Red", "isCorrect": true },
      { "text": "A large stone", "isCorrect": false },
      { "text": "White", "isCorrect": false }
    ],
    "explanation": "Jack đang gọi để mời bạn đến nhà. Ngôi nhà của Jack màu gì?"
  },
  {
    "question": "A man is describing his school. What color is the teacher’s building?",
    "options": [
      { "text": "White", "isCorrect": true },
      { "text": "Red", "isCorrect": false },
      { "text": "Phone", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang mô tả trường học của mình. Tòa nhà của giáo viên màu gì?"
  },
  {
    "question": "A saleswoman is talking to a customer about a house. What is not original?",
    "options": [
      { "text": "Furniture", "isCorrect": true },
      { "text": "Teacher", "isCorrect": false },
      { "text": "Fire from the countryside", "isCorrect": false }
    ],
    "explanation": "Một nhân viên bán hàng đang nói chuyện với khách hàng về một ngôi nhà. Cái gì không độc đáo?"
  },
  {
    "question": "Listen to a writer talking about her job. What was her first job?",
    "options": [
      { "text": "Teacher", "isCorrect": true },
      { "text": "Furniture", "isCorrect": false },
      { "text": "Best friends", "isCorrect": false }
    ],
    "explanation": "Nghe một nhà văn nói về công việc của cô ấy. Công việc đầu tiên của cô ấy là gì?"
  },
  {
    "question": "A man is talking about the environment of the countryside. What is the main cause of poor air quality?",
    "options": [
      { "text": "Fire from the countryside", "isCorrect": true },
      { "text": "Teacher", "isCorrect": false },
      { "text": "Cold and wet", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang nói về môi trường nông thôn. Nguyên nhân chính của chất lượng không khí kém là gì?"
  },
  {
    "question": "Who does she live with?",
    "options": [
      { "text": "Best friends", "isCorrect": true },
      { "text": "Fire from the countryside", "isCorrect": false },
      { "text": "The use of technology will increase", "isCorrect": false }
    ],
    "explanation": "Cô ấy sống với ai?"
  },
  {
    "question": "A woman is talking about her vacation. What is the relationship between Lisa and the speaker?",
    "options": [
      { "text": "Best friends", "isCorrect": true },
      { "text": "Cold and wet", "isCorrect": false },
      { "text": "Computer", "isCorrect": false }
    ],
    "explanation": "Một người phụ nữ đang nói về kỳ nghỉ của mình. Mối quan hệ giữa Lisa và người nói là gì?"
  },
  {
    "question": "Two friends are talking about their trip. What will the weather be like?",
    "options": [
      { "text": "Cold and wet", "isCorrect": true },
      { "text": "Best friends", "isCorrect": false },
      { "text": "Practical", "isCorrect": false }
    ],
    "explanation": "Hai người bạn đang nói về chuyến đi của họ. Thời tiết sẽ như thế nào?"
  },
  {
    "question": "What is his opinion about sea transport?",
    "options": [
      { "text": "The use of technology will increase", "isCorrect": true },
      { "text": "Cold and wet", "isCorrect": false },
      { "text": "Computer", "isCorrect": false }
    ],
    "explanation": "Ý kiến của anh ấy về vận tải biển là gì?"
  },
  {
    "question": "What is not working?",
    "options": [
      { "text": "Computer", "isCorrect": true },
      { "text": "The use of technology will increase", "isCorrect": false },
      { "text": "Practical", "isCorrect": false }
    ],
    "explanation": "Cái gì không hoạt động?"
  },
  {
    "question": "A man is talking about how he goes to work. Why does he prefer traveling by train?",
    "options": [
      { "text": "Practical", "isCorrect": true },
      { "text": "Computer", "isCorrect": false },
      { "text": "Sick", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang nói về cách anh ta đi làm. Tại sao anh ấy thích đi tàu hơn?"
  },
  {
    "question": "Why did she call her mother to pick up at the airport?",
    "options": [
      { "text": "Sick", "isCorrect": true },
      { "text": "Practical", "isCorrect": false },
      { "text": "Long and red", "isCorrect": false }
    ],
    "explanation": "Tại sao cô ấy gọi mẹ đến đón ở sân bay?"
  },
  {
    "question": "Listen to a voice message. How does Evan feel?",
    "options": [
      { "text": "Sick", "isCorrect": true },
      { "text": "Long and red", "isCorrect": false },
      { "text": "Furniture", "isCorrect": false }
    ],
    "explanation": "Nghe tin nhắn thoại. Evan cảm thấy thế nào?"
  },
  {
    "question": "A girl is calling her mother. Which dress does she want?",
    "options": [
      { "text": "Long and red", "isCorrect": true },
      { "text": "Sick", "isCorrect": false },
      { "text": "Furniture", "isCorrect": false }
    ],
    "explanation": "Một cô gái đang gọi cho mẹ mình. Cô ấy muốn chiếc váy nào?"
  },
  {
    "question": "Listen to a woman talking about what she has just bought. What does dress she wears like?",
    "options": [
      { "text": "Long and red", "isCorrect": true },
      { "text": "Sick", "isCorrect": false },
      { "text": "Furniture", "isCorrect": false }
    ],
    "explanation": "Hãy nghe một người phụ nữ nói về những gì cô ấy vừa mua. Chiếc váy cô ấy mặc như thế nào?"
  },
  {
    "question": "A man is talking about his family trip. What does the man’s wife enjoy?",
    "options": [
      { "text": "Photography", "isCorrect": true },
      { "text": "Short", "isCorrect": false },
      { "text": "The drawer", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang nói về chuyến đi gia đình của anh ấy. Vợ của người đàn ông thích gì?"
  },
  {
    "question": "Jana is talking to her friend. What does Jana’s sister look like?",
    "options": [
      { "text": "Short", "isCorrect": true },
      { "text": "Photography", "isCorrect": false },
      { "text": "Department store", "isCorrect": false }
    ],
    "explanation": "Jana đang nói chuyện với bạn của cô ấy. Em gái của Jana trông như thế nào?"
  },
  {
    "question": "A woman is talking about her favorite film on the radio. What film did she recommend?",
    "options": [
      { "text": "An action film", "isCorrect": true },
      { "text": "Short", "isCorrect": false },
      { "text": "The drawer", "isCorrect": false }
    ],
    "explanation": "Một người phụ nữ đang nói về bộ phim yêu thích của mình trên radio. Cô ấy đã giới thiệu bộ phim nào?"
  },
  {
    "question": "Listen to an auction man talking about a cabinet. Which part of the cabinet is original?",
    "options": [
      { "text": "The drawer", "isCorrect": true },
      { "text": "An action film", "isCorrect": false },
      { "text": "Bathroom", "isCorrect": false }
    ],
    "explanation": "Hãy nghe người bán đấu giá nói về một chiếc tủ. Phần nào của tủ là nguyên bản/độc đáo?"
  },
  {
    "question": "A tour guide is introducing a famous building. What is this building currently used for?",
    "options": [
      { "text": "Department store", "isCorrect": true },
      { "text": "The drawer", "isCorrect": false },
      { "text": "The kitchen", "isCorrect": false }
    ],
    "explanation": "Hướng dẫn viên du lịch đang giới thiệu một tòa nhà nổi tiếng. Tòa nhà này hiện đang được sử dụng để làm gì?"
  },
  {
    "question": "Soobin is talking about his favorite room. What is Soobin’s favorite room?",
    "options": [
      { "text": "Bathroom", "isCorrect": true },
      { "text": "Department store", "isCorrect": false },
      { "text": "The kitchen", "isCorrect": false }
    ],
    "explanation": "Soobin đang nói về phòng yêu thích của mình. Phòng yêu thích của Soobin là gì?"
  },
  {
    "question": "Listen to a saleswoman talking about a property. Which room is the largest?",
    "options": [
      { "text": "The kitchen", "isCorrect": true },
      { "text": "Bathroom", "isCorrect": false },
      { "text": "The girls’ team", "isCorrect": false }
    ],
    "explanation": "Hãy nghe người bán hàng nói về một bất động sản. Phòng nào lớn nhất?"
  },
  {
    "question": "Listen to the conversation. Who is she taking a photo of?",
    "options": [
      { "text": "The girls’ team", "isCorrect": true },
      { "text": "The kitchen", "isCorrect": false },
      { "text": "His sister and her children", "isCorrect": false }
    ],
    "explanation": "Hãy lắng nghe cuộc trò chuyện. Cô ấy đang chụp ảnh ai?"
  },
  {
    "question": "Tom is calling his mom. Who is visiting Tom this weekend?",
    "options": [
      { "text": "His sister and her children", "isCorrect": true },
      { "text": "The girls’ team", "isCorrect": false },
      { "text": "Poor weather condition", "isCorrect": false }
    ],
    "explanation": "Tom đang gọi cho mẹ anh ấy. Ai đến thăm Tom cuối tuần này?"
  },
  {
    "question": "Listen to the announcement from a travel agent representative. Why is the air travel cancelled?",
    "options": [
      { "text": "Poor weather condition", "isCorrect": true },
      { "text": "His sister and her children", "isCorrect": false },
      { "text": "A performance space", "isCorrect": false }
    ],
    "explanation": "Hãy lắng nghe thông báo từ đại diện công ty du lịch. Tại sao chuyến bay bị hủy?"
  },
  {
    "question": "Listen to a principal talking about new school facilities. What new facility will the school have?",
    "options": [
      { "text": "A performance space", "isCorrect": true },
      { "text": "Poor weather condition", "isCorrect": false },
      { "text": "Photography", "isCorrect": false }
    ],
    "explanation": "Lắng nghe hiệu trưởng nói về các cơ sở mới của trường. Trường sẽ có cơ sở mới nào?"
  },
  {
    "question": "What sport does she good at?",
    "options": [
      { "text": "Football", "isCorrect": true },
      { "text": "Boing đá", "isCorrect": false },
      { "text": "Shoes", "isCorrect": false }
    ],
    "explanation": "Cô ấy giỏi môn thể thao nào?"
  },
  {
    "question": "What did he leave in the yard?",
    "options": [
      { "text": "Shoes", "isCorrect": true },
      { "text": "Football", "isCorrect": false },
      { "text": "Food", "isCorrect": false }
    ],
    "explanation": "Anh ấy để lại gì trong sân?"
  },
  {
    "question": "Pierre and Emma are talking together about the picnic on the weekend. What will they bring to the picnic?",
    "options": [
      { "text": "Food", "isCorrect": true },
      { "text": "Shoes", "isCorrect": false },
      { "text": "Fruit", "isCorrect": false }
    ],
    "explanation": "Pierre và Emma đang nói chuyện về buổi dã ngoại vào cuối tuần. Họ sẽ mang gì đến buổi dã ngoại?"
  },
  {
    "question": "What did they bring?",
    "options": [
      { "text": "Fruit", "isCorrect": true },
      { "text": "Food", "isCorrect": false },
      { "text": "Become a writer", "isCorrect": false }
    ],
    "explanation": "Họ mang theo gì?"
  },
  {
    "question": "A man is talking about his jobs. What does the man want to do next?",
    "options": [
      { "text": "Become a writer", "isCorrect": true },
      { "text": "Fruit", "isCorrect": false },
      { "text": "Not enough people", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang nói về công việc của mình. Người đàn ông muốn làm gì tiếp theo?"
  },
  {
    "question": "Why was the trip to the museum delayed?",
    "options": [
      { "text": "Not enough people", "isCorrect": true },
      { "text": "Become a writer", "isCorrect": false },
      { "text": "Because of its size", "isCorrect": false }
    ],
    "explanation": "Tại sao chuyến đi đến bảo tàng bị hoãn?"
  },
  {
    "question": "A tour guide is making an announcement. Why was the tour canceled?",
    "options": [
      { "text": "Not enough people", "isCorrect": true },
      { "text": "Because of its size", "isCorrect": false },
      { "text": "With people", "isCorrect": false }
    ],
    "explanation": "Một hướng dẫn viên đang thông báo. Tại sao chuyến tham quan bị hủy?"
  },
  {
    "question": "A woman is talking to a shop assistant. Why does the woman return the dress?",
    "options": [
      { "text": "Because of its size", "isCorrect": true },
      { "text": "Not enough people", "isCorrect": false },
      { "text": "To help people", "isCorrect": false }
    ],
    "explanation": "Một người phụ nữ đang nói chuyện với nhân viên bán hàng. Tại sao người phụ nữ trả lại chiếc váy?"
  },
  {
    "question": "Why should he be a doctor?",
    "options": [
      { "text": "With people", "isCorrect": true },
      { "text": "Because of its size", "isCorrect": false },
      { "text": "To help people", "isCorrect": false }
    ],
    "explanation": "Tại sao anh ấy nên trở thành bác sĩ?"
  },
  {
    "question": "A woman shares her job with her friend. Why does she want to become a writer?",
    "options": [
      { "text": "To help people", "isCorrect": true },
      { "text": "With people", "isCorrect": false },
      { "text": "Trousers", "isCorrect": false }
    ],
    "explanation": "Một người phụ nữ chia sẻ công việc của mình với bạn. Tại sao cô ấy muốn trở thành nhà văn?"
  },
  {
    "question": "A man is talking to his friend. Why does he choose to be a doctor?",
    "options": [
      { "text": "To help people", "isCorrect": true },
      { "text": "Trousers", "isCorrect": false },
      { "text": "Ask for more money", "isCorrect": false }
    ],
    "explanation": "Một người đàn ông đang nói chuyện với bạn mình. Tại sao anh ấy chọn làm bác sĩ?"
  },
  {
    "question": "What did the two people buy?",
    "options": [
      { "text": "Trousers", "isCorrect": true },
      { "text": "To help people", "isCorrect": false },
      { "text": "Ask for more money", "isCorrect": false }
    ],
    "explanation": "Hai người đã mua gì?"
  },
  {
    "question": "A finance expert is giving advice to young people. What should young people do?",
    "options": [
      { "text": "Ask for more money", "isCorrect": true },
      { "text": "Trousers", "isCorrect": false },
      { "text": "Football", "isCorrect": false }
    ],
    "explanation": "Một chuyên gia tài chính đang đưa ra lời khuyên cho người trẻ. Người trẻ nên làm gì?"
  },



  
  ];



  // DỮ LIỆU MỚI CHO Q16-17
  const topicQ16_17: MultiQuestionSet[] = [
  {
    id: "de-1",
    topic: "Đề 1: 2 famous writers (Phiên bản 1 & 2)",
    // audioSrc: "/audio/de-1.mp3", // (Tùy chọn)
    
    questionGroup16: {
      question16_1: {
        question: "2 famous writers (Phiên bản 1)",
        options: [
          { text: "They wrote in a very similar style.", isCorrect: false },
          { text: "They have both been overlooked by academics.", isCorrect: true },
          { text: "Their books were not popular.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: WRITERS – overlooked – not always easily identified. (Cả hai đều bị các học giả bỏ qua.)"
      },
      question16_2: {
        question: "2 famous writers (Phiên bản 1)",
        options: [
          { text: "They were only famous after they died.", isCorrect: false },
          { text: "Their work is easy to understand.", isCorrect: false },
          { text: "The meaning of their work is not always easily identified", isCorrect: true },
        ],
        explanation: "Bản rút gọn: WRITERS – overlooked – not always easily identified. (Ý nghĩa công việc của họ không phải lúc nào cũng dễ dàng được xác định.)"
      }
    },
    questionGroup17: {
      question17_1: {
        question: "2 famous writers (Phiên bản 2)",
        options: [
          { text: "They both make references to each other in their work", isCorrect: true },
          { text: "They were best friends.", isCorrect: false },
          { text: "They never met each other.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: WRITERS – both – always easily. (Cả hai đều đề cập đến nhau trong tác phẩm của họ.)"
      },
      question17_2: {
        question: "2 famous writers (Phiên bản 2)",
        options: [
          { text: "The meaning of their work is not always easily identified", isCorrect: true },
          { text: "Their work is only for academics.", isCorrect: false },
          { text: "The work is simple and clear.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: WRITERS – both – always easily. (Ý nghĩa công việc của họ không phải lúc nào cũng dễ dàng được xác định.)"
      }
    }
  },
  {
    id: "de-2",
    topic: "Đề 2 & 3: Guidebook & Writer's block",
    // audioSrc: "/audio/de-2.mp3", // (Tùy chọn)
    
    questionGroup16: {
      question16_1: {
        question: "Đề 2: A new guidebook",
        options: [
          { text: "It creates an adventure.", isCorrect: true },
          { text: "It is very boring.", isCorrect: false },
          { text: "It is a normal travel book.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: GUIDE – creates – only suitable. (Nó tạo ra một cuộc phiêu lưu.)"
      },
      question16_2: {
        question: "Đề 2: A new guidebook",
        options: [
          { text: "It is suitable for everyone.", isCorrect: false },
          { text: "It is only suitable for particular generations", isCorrect: true },
          { text: "It is only for old people.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: GUIDE – creates – only suitable. (Nó chỉ phù hợp với các thế hệ cụ thể.)"
      }
    },
    questionGroup17: {
      question17_1: {
        question: "Đề 3: Writer's block",
        options: [
          { text: "Create dedicated periods for writing", isCorrect: true },
          { text: "Wait for inspiration.", isCorrect: false },
          { text: "Stop writing for a while.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: WRITER'S BLOCK – create – seek. (Tạo ra các khoảng thời gian dành riêng cho việc viết.)"
      },
      question17_2: {
        question: "Đề 3: Writer's block",
        options: [
          { text: "Refuse to seek advice of others", isCorrect: true },
          { text: "Ask many people for help.", isCorrect: false },
          { text: "Only ask close friends.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: WRITER'S BLOCK – create – seek. (Từ chối tìm kiếm lời khuyên của người khác.)"
      }
    }
  },
  {
    id: "de-3",
    topic: "Đề 4 & 5: New Novel & Science Book",
    // audioSrc: "/audio/de-3.mp3", // (Tùy chọn)
    
    questionGroup16: {
      question16_1: {
        question: "Đề 4: A new novel of a famous writer",
        options: [
          { text: "It is quite different from his earlier works", isCorrect: true },
          { text: "It is exactly the same as his last book.", isCorrect: false },
          { text: "It is not as good as his earlier works.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: NEW NOVEL OF A FAMOUS WRITER – quite – should listen. (Nó khá khác biệt so với các tác phẩm trước đây của ông.)"
      },
      question16_2: {
        question: "Đề 4: A new novel of a famous writer",
        options: [
          { text: "He ignores all critics.", isCorrect: false },
          { text: "He should listen to critics before writing his next work", isCorrect: true },
          { text: "He only listens to his fans.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: NEW NOVEL OF A FAMOUS WRITER – quite – should listen. (Ông nên lắng nghe các nhà phê bình trước khi viết tác phẩm tiếp theo.)"
      }
    },
    questionGroup17: {
      question17_1: {
        question: "Đề 5: A new book about science",
        options: [
          { text: "It is exciting to read", isCorrect: true },
          { text: "It is very difficult to understand.", isCorrect: false },
          { text: "It is only for scientists.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: A NEW BOOK ABOUT SCIENCE – exciting – written for general audience. (Nó thú vị để đọc.)"
      },
      question17_2: {
        question: "Đề 5: A new book about science",
        options: [
          { text: "It has been written for a general audience", isCorrect: true },
          { text: "It is written for children.", isCorrect: false },
          { text: "It is an academic textbook.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: A NEW BOOK ABOUT SCIENCE – exciting – written for general audience. (Nó được viết cho khán giả đại chúng.)"
      }
    }
  },
  {
    id: "de-4",
    topic: "Đề 6 & 7: Script Production & New Series",
    // audioSrc: "/audio/de-4.mp3", // (Tùy chọn)
    
    questionGroup16: {
      question16_1: {
        question: "Đề 6: Script production",
        options: [
          { text: "The characters' background are not adequately explored", isCorrect: true },
          { text: "The characters are very interesting.", isCorrect: false },
          { text: "The script is perfect.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: SCRIPT – character's – negatively influencing. (Lý lịch của các nhân vật chưa được khám phá đầy đủ.)"
      },
      question16_2: {
        question: "Đề 6: Script production",
        options: [
          { text: "The new demands are helping production.", isCorrect: false },
          { text: "The new industry demands are negatively influencing script production", isCorrect: true },
          { text: "The industry demands have not changed.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: SCRIPT – character's – negatively influencing. (Các yêu cầu mới của ngành đang ảnh hưởng tiêu cực đến việc sản xuất kịch bản.)"
      }
    },
    questionGroup17: {
      question17_1: {
        question: "Đề 7: The script of the new series",
        options: [
          { text: "The dialogues seem unrealistic", isCorrect: true },
          { text: "The dialogues are very clever.", isCorrect: false },
          { text: "The dialogues are borrowed from other series.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: SCRIPT OF THE NEW SERIES – dialogues – negatively influencing. (Các đoạn hội thoại có vẻ không thực tế.)"
      },
      question17_2: {
        question: "Đề 7: The script of the new series",
        options: [
          { text: "The new industry demand is negatively influencing script production", isCorrect: true },
          { text: "The industry demand helps improve the script.", isCorrect: false },
          { text: "The industry demand is not important.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: SCRIPT OF THE NEW SERIES – dialogues – negatively influencing. (Yêu cầu mới của ngành đang ảnh hưởng tiêu cực đến việc sản xuất kịch bản.)"
      }
    }
  },
  {
    id: "de-5",
    topic: "Đề 8 & 9: University & Sports",
    // audioSrc: "/audio/de-5.mp3", // (Tùy chọn)
    
    questionGroup16: {
      question16_1: {
        question: "Đề 8: Life after university",
        options: [
          { text: "They are likely to be more flexible and open-minded", isCorrect: true },
          { text: "They are becoming more stubborn.", isCorrect: false },
          { text: "They find it hard to get a job.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: AFTER UNIVERSITY – flexible – more competitive. (Họ có thể sẽ linh hoạt và cởi mở hơn.)"
      },
      question16_2: {
        question: "Đề 8: Life after university",
        options: [
          { text: "They are becoming more competitive", isCorrect: true },
          { text: "They are less competitive.", isCorrect: false },
          { text: "They stop learning new things.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: AFTER UNIVERSITY – flexible – more competitive. (Họ đang trở nên cạnh tranh hơn.)"
      }
    },
    questionGroup17: {
      question17_1: {
        question: "Đề 9: Nói về sports ở trường học",
        options: [
          { text: "They help ... (health promotion)", isCorrect: true },
          { text: "They are a waste of time.", isCorrect: false },
          { text: "They are only for fun.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: SPORTS – help – balance. (Chúng giúp... (thúc đẩy sức khỏe).)"
      },
      question17_2: {
        question: "Đề 9: Nói về sports ở trường học",
        options: [
          { text: "It provides balance", isCorrect: true },
          { text: "It makes students tired.", isCorrect: false },
          { text: "It is not very important.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: SPORTS – help – balance. (Nó cung cấp sự cân bằng.)"
      }
    }
  },
  {
    id: "de-6",
    topic: "Đề 10 & 11: Sport & Musician's Life",
    // audioSrc: "/audio/de-6.mp3", // (Tùy chọn)
    
    questionGroup16: {
      question16_1: {
        question: "Đề 10: Sport – thể thao",
        options: [
          { text: "They can cause harmful effects", isCorrect: true },
          { text: "They are always good for health.", isCorrect: false },
          { text: "They are only for young people.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: SPORT – harmful – balance. (Chúng có thể gây ra tác dụng có hại.)"
      },
      question16_2: {
        question: "Đề 10: Sport – thể thao",
        options: [
          { text: "Provides them with a balance in their lives.", isCorrect: true },
          { text: "Wastes a lot of money.", isCorrect: false },
          { text: "Is not necessary for adults.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: SPORT – harmful – balance. (Cung cấp cho họ sự cân bằng trong cuộc sống.)"
      }
    },
    questionGroup17: {
      question17_1: {
        question: "Đề 11: A musician's life",
        options: [
          { text: "He will probably retire from singing professionally", isCorrect: true },
          { text: "He will continue singing forever.", isCorrect: false },
          { text: "He wants to start a new band.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: MUSICIAN'S LIFE – retire – more successful. (Anh ấy có thể sẽ nghỉ hưu, không hát chuyên nghiệp nữa.)"
      },
      question17_2: {
        question: "Đề 11: A musician's life",
        options: [
          { text: "He could have been more successful", isCorrect: true },
          { text: "He thinks he was not successful.", isCorrect: false },
          { text: "He is the most successful musician.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: MUSICIAN'S LIFE – retire – more successful. (Anh ấy có thể đã thành công hơn.)"
      }
    }
  },
  {
    id: "de-7",
    topic: "Đề 12 & 13: Professionalism & Work From Home",
    // audioSrc: "/audio/de-7.mp3", // (Tùy chọn)
    
    questionGroup16: {
      question16_1: {
        question: "Đề 12: Professionalism at work",
        options: [
          { text: "To maintain positive attitude", isCorrect: true },
          { text: "To always be serious.", isCorrect: false },
          { text: "To follow all rules without question.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: PROFESSIONALISM – positive – change. (Để duy trì thái độ tích cực.)"
      },
      question16_2: {
        question: "Đề 12: Professionalism at work",
        options: [
          { text: "Our definition of it is changing", isCorrect: true },
          { text: "The definition is always the same.", isCorrect: false },
          { text: "The definition is not important.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: PROFESSIONALISM – positive – change. (Định nghĩa của chúng ta về nó đang thay đổi.)"
      }
    },
    questionGroup17: {
      question17_1: {
        question: "Đề 13: Nói về work from home",
        options: [
          { text: "It wasn't as good as she had expected", isCorrect: true },
          { text: "It was better than she expected.", isCorrect: false },
          { text: "It was exactly as she expected.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: WORK FROM HOME – wasn't as good as – depends. (Nó không tốt như cô ấy mong đợi.)"
      },
      question17_2: {
        question: "Đề 13: Nói về work from home",
        options: [
          { text: "It depends on your situation and personality", isCorrect: true },
          { text: "It is good for everyone.", isCorrect: false },
          { text: "It is bad for everyone.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: WORK FROM HOME – wasn't as good as – depends. (Nó phụ thuộc vào hoàn cảnh và tính cách của bạn.)"
      }
    }
  },
  {
    id: "de-8",
    topic: "Đề 14 & 15: TV series & Advertising",
    // audioSrc: "/audio/de-8.mp3", // (Tùy chọn)
    
    questionGroup16: {
      question16_1: {
        question: "Đề 14: TV series",
        options: [
          { text: "It caught the audience's attention from the start", isCorrect: true },
          { text: "It was boring at the beginning.", isCorrect: false },
          { text: "Only the ending was good.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: TV SERIES – attention – audience's. (Nó đã thu hút sự chú ý của khán giả ngay từ đầu.)"
      },
      question16_2: {
        question: "Đề 14: TV series",
        options: [
          { text: "It was too long.", isCorrect: false },
          { text: "It had a surprising ending.", isCorrect: true }, // Giả định dựa trên logic chung, ảnh không có
          { text: "It was very predictable.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: TV SERIES – attention – audience's. (Không có thông tin cho câu 2, thêm câu nhiễu)"
      }
    },
    questionGroup17: {
      question17_1: {
        question: "Đề 15: Advertising and sponsoring",
        options: [
          { text: "Series are damaged by overexposure", isCorrect: true },
          { text: "Overexposure helps the series.", isCorrect: false },
          { text: "Advertising is not effective.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: ADVERTISING – overexposure – negative publicity. (Các loạt phim bị hư hỏng do tiếp xúc quá nhiều.)"
      },
      question17_2: {
        question: "Đề 15: Advertising and sponsoring",
        options: [
          { text: "They can generate negative publicity for the sport", isCorrect: true },
          { text: "They always generate positive publicity.", isCorrect: false },
          { text: "They do not affect the sport's publicity.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: ADVERTISING – overexposure – negative publicity. (Chúng có thể tạo ra dư luận tiêu cực cho môn thể thao.)"
      }
    }
  },
  {
    id: "de-9",
    topic: "Đề 16 & 17: CCTV & Making plans",
    // audioSrc: "/audio/de-9.mp3", // (Tùy chọn)
    
    questionGroup16: {
      question16_1: {
        question: "Đề 16: Topic cctv/ security cameras",
        options: [
          { text: "Employees probably worry unnecessarily", isCorrect: true },
          { text: "Employees feel safe.", isCorrect: false },
          { text: "Employees do not notice them.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: CCTV/ SECURITY CAMERAS – unnecessarily – reassured. (Nhân viên có thể lo lắng một cách không cần thiết.)"
      },
      question16_2: {
        question: "Đề 16: Topic cctv/ security cameras",
        options: [
          { text: "People should feel reassured about their presence", isCorrect: true },
          { text: "People should be worried.", isCorrect: false },
          { text: "People should ignore them.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: CCTV/ SECURITY CAMERAS – unnecessarily – reassured. (Mọi người nên cảm thấy yên tâm về sự hiện diện của chúng.)"
      }
    },
    questionGroup17: {
      question17_1: {
        question: "Đề 17: Making plans",
        options: [
          { text: "It allows you to be more flexible.", isCorrect: true },
          { text: "It makes you rigid.", isCorrect: false },
          { text: "It is a waste of time.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: MAKING PLANS – flexible – mistakes. (Nó cho phép bạn linh hoạt hơn.)"
      },
      question17_2: {
        question: "Đề 17: Making plans",
        options: [
          { text: "It can prevent you from making mistakes.", isCorrect: true },
          { text: "It causes more mistakes.", isCorrect: false },
          { text: "It does not affect mistakes.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: MAKING PLANS – flexible – mistakes. (Nó có thể ngăn bạn mắc sai lầm.)"
      }
    }
  },
  {
    id: "de-10",
    topic: "Đề 18 & 19: Promotion campaign & Transport plan",
    // audioSrc: "/audio/de-10.mp3", // (Tùy chọn)
    
    questionGroup16: {
      question16_1: {
        question: "Đề 18: A promotion campaign for a product",
        options: [
          { text: "They use exaggerated claims", isCorrect: true },
          { text: "They are very honest.", isCorrect: false },
          { text: "They do not give enough information.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: PROMOTION CAMPAIGN – exaggerated – profitable. (Họ sử dụng các tuyên bố phóng đại.)"
      },
      question16_2: {
        question: "Đề 18: A promotion campaign for a product",
        options: [
          { text: "It costs too much to make to be profitable.", isCorrect: true },
          { text: "It is very cheap to make.", isCorrect: false },
          { text: "The cost is reasonable.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: PROMOTION CAMPAIGN – exaggerated – profitable. (Nó tốn quá nhiều chi phí để thực hiện để có lãi.)"
      }
    },
    questionGroup17: {
      question17_1: {
        question: "Đề 19: New transport plan",
        options: [
          { text: "It doesn't provide enough alternatives to driving.", isCorrect: true },
          { text: "It provides many alternatives.", isCorrect: false },
          { text: "It bans driving completely.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: TRANSPORT – alternatives – resistance. (Nó không cung cấp đủ các phương án thay thế cho việc lái xe.)"
      },
      question17_2: {
        question: "Đề 19: New transport plan",
        options: [
          { text: "It is likely to meet resistance from local communities.", isCorrect: true },
          { text: "It is popular with local communities.", isCorrect: false },
          { text: "Local communities are not affected.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: TRANSPORT – alternatives – resistance. (Nó có khả năng vấp phải sự phản đối từ các cộng đồng địa phương.)"
      }
    }
  },
  {
    id: "de-11",
    topic: "Đề 20 & 21: Restaurant & Financial spending",
    // audioSrc: "/audio/de-11.mp3", // (Tùy chọn)
    
    questionGroup16: {
      question16_1: {
        question: "Đề 20: Nói về restaurant",
        options: [
          { text: "The standard of service wasn't good", isCorrect: true },
          { text: "The food was bad.", isCorrect: false },
          { text: "The price was too high.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: RESTAURANT – wasn't good – welcome. (Chất lượng dịch vụ không tốt.)"
      },
      question16_2: {
        question: "Đề 20: Nói về restaurant",
        options: [
          { text: "They need to make customers feel valued and welcome", isCorrect: true },
          { text: "They should lower their prices.", isCorrect: false },
          { text: "They should hire a new chef.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: RESTAURANT – wasn't good – welcome. (Họ cần làm cho khách hàng cảm thấy được trân trọng và chào đón.)"
      }
    },
    questionGroup17: {
      question17_1: {
        question: "Đề 21: Managing financial spending",
        options: [
          { text: "Organizing their resources more effectively", isCorrect: true },
          { text: "Spending less money.", isCorrect: false },
          { text: "Earning more money.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: SPENDING – organize – seek advice. (Tổ chức các nguồn lực của họ hiệu quả hơn.)"
      },
      question17_2: {
        question: "Đề 21: Managing financial spending",
        options: [
          { text: "Seek advice from someone who have experience", isCorrect: true },
          { text: "Try to solve it themselves.", isCorrect: false },
          { text: "Read a book about finance.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: SPENDING – organize – seek advice. (Tìm kiếm lời khuyên từ người có kinh nghiệm.)"
      }
    }
  },
  {
    id: "de-12",
    topic: "Đề 22 & 23: Happiness research & Sleep",
    // audioSrc: "/audio/de-12.mp3", // (Tùy chọn)
    
    questionGroup16: {
      question16_1: {
        question: "Đề 22: A research into happiness",
        options: [
          { text: "It has not been accurately reported by the media", isCorrect: true },
          { text: "It was reported well by the media.", isCorrect: false },
          { text: "The media ignored the research.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: RESEARCH INTO HAPPINESS – not accurately reported – unlikely to find. (Nó không được truyền thông đưa tin chính xác.)"
      },
      question16_2: {
        question: "Đề 22: A research into happiness",
        options: [
          { text: "The research is unlikely to find a conclusive answer", isCorrect: true },
          { text: "The research found the key to happiness.", isCorrect: false },
          { text: "The research was a waste of time.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: RESEARCH INTO HAPPINESS – not accurately reported – unlikely to find. (Nghiên cứu không có khả năng tìm ra câu trả lời cuối cùng.)"
      }
    },
    questionGroup17: {
      question17_1: {
        question: "Đề 23: The importance of sleep",
        options: [
          { text: "Blocking out noise and light is a key", isCorrect: true },
          { text: "Noise and light do not affect sleep.", isCorrect: false },
          { text: "Sleeping pills are the key.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: SLEEP – key – media. (Chặn tiếng ồn và ánh sáng là một chìa khóa.)"
      },
      question17_2: {
        question: "Đề 23: The importance of sleep",
        options: [
          { text: "The media overemphasizes the subject", isCorrect: true },
          { text: "The media does not talk about sleep.", isCorrect: false },
          { text: "The media gives good advice about sleep.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: SLEEP – key – media. (Các phương tiện truyền thông quá nhấn mạnh chủ đề này.)"
      }
    }
  },
  {
    id: "de-13",
    topic: "Đề 24 & 25: New novel",
    // audioSrc: "/audio/de-13.mp3", // (Tùy chọn)
    
    questionGroup16: {
      question16_1: {
        question: "Đề 24: Criticism of the new novel",
        options: [
          { text: "The characters were interesting", isCorrect: true },
          { text: "The plot was boring.", isCorrect: false },
          { text: "The characters were flat.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: NEW NOVEL – characters – author's. (Các nhân vật thú vị.)"
      },
      question16_2: {
        question: "Đề 24: Criticism of the new novel",
        options: [
          { text: "It will establish the author's popularity", isCorrect: true },
          { text: "It will not be popular.", isCorrect: false },
          { text: "It is just an average book.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: NEW NOVEL – characters – author's. (Nó sẽ thiết lập sự nổi tiếng của tác giả.)"
      }
    },
    questionGroup17: {
      question17_1: {
        question: "Đề 25: New novel",
        options: [
          { text: "They are difficult to relate to", isCorrect: true },
          { text: "The characters are very relatable.", isCorrect: false },
          { text: "The novel is easy to read.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: NEW NOVEL – difficult – lacks. (Chúng (nhân vật) rất khó để liên hệ/đồng cảm.)"
      },
      question17_2: {
        question: "Đề 25: New novel",
        options: [
          { text: "It lacks originality", isCorrect: true },
          { text: "It is very original.", isCorrect: false },
          { text: "It has a creative plot.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: NEW NOVEL – difficult – lacks. (Nó thiếu tính độc đáo.)"
      }
    }
  },
  {
    id: "de-14",
    topic: "Đề 26 & 27: A new book & Scientist book",
    // audioSrc: "/audio/de-14.mp3", // (Tùy chọn)
    
    questionGroup16: {
      question16_1: {
        question: "Đề 26: A new book",
        options: [
          { text: "The plot was very strong", isCorrect: true },
          { text: "The plot was weak.", isCorrect: false },
          { text: "The plot was confusing.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: NEW BOOK/NOVEL – very strong – very similar. (Cốt truyện rất mạnh mẽ.)"
      },
      question16_2: {
        question: "Đề 26: A new book",
        options: [
          { text: "It is very similar to the author's other books", isCorrect: true },
          { text: "It is very different from other books.", isCorrect: false },
          { text: "It is a completely new style.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: NEW BOOK/NOVEL – very strong – very similar. (Nó rất giống với những cuốn sách khác của tác giả.)"
      }
    },
    questionGroup17: {
      question17_1: {
        question: "Đề 27: A book about a life of a scientist",
        options: [
          { text: "It uses simple language to describe complex ideas", isCorrect: true },
          { text: "It uses very complex language.", isCorrect: false },
          { text: "It is difficult for non-scientists to read.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: A BOOK ABOUT A LIFE OF A SCIENTIST – simple language – similar. (Nó sử dụng ngôn ngữ đơn giản để mô tả các ý tưởng phức tạp.)"
      },
      question17_2: {
        question: "Đề 27: A book about a life of a scientist",
        options: [
          { text: "It is similar to the previous book about the scientist", isCorrect: true },
          { text: "It is very different from the previous book.", isCorrect: false },
          { text: "This is the first book about the scientist.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: A BOOK ABOUT A LIFE OF A SCIENTIST – simple language – similar. (Nó tương tự như cuốn sách trước đó về nhà khoa học.)"
      }
    }
  },
  {
    id: "de-15",
    topic: "Đề 28 & 29: Break from studying & TV series",
    // audioSrc: "/audio/de-15.mp3", // (Tùy chọn)
    
    questionGroup16: {
      question16_1: {
        question: "Đề 28: A break from studying",
        options: [
          { text: "He wasn't ready to start higher education", isCorrect: true },
          { text: "He was ready for more studying.", isCorrect: false },
          { text: "He was forced to take a break.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: BREAK – wasn't ready – more independent. (Anh ấy chưa sẵn sàng để bắt đầu học cao hơn.)"
      },
      question16_2: {
        question: "Đề 28: A break from studying",
        options: [
          { text: "How to be more independent", isCorrect: true },
          { text: "How to study better.", isCorrect: false },
          { text: "How to make money.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: BREAK – wasn't ready – more independent. (Làm thế nào để độc lập hơn.)"
      }
    },
    questionGroup17: {
      question17_1: {
        question: "Đề 29: Television series",
        options: [
          { text: "It has the consistent quality throughout", isCorrect: true },
          { text: "The quality was inconsistent.", isCorrect: false },
          { text: "The first season was the best.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: TELEVISION SERIES – consistent – are made. (Nó có chất lượng nhất quán trong suốt.)"
      },
      question17_2: {
        question: "Đề 29: Television series",
        options: [
          { text: "Viewer habits influence the way that series are made", isCorrect: true },
          { text: "Viewer habits do not matter.", isCorrect: false },
          { text: "The creators decide everything.", isCorrect: false },
        ],
        explanation: "Bản rút gọn: TELEVISION SERIES – consistent – are made. (Thói quen của người xem ảnh hưởng đến cách mà các loạt phim được thực hiện.)"
      }
    }
  }
]

  const topics: Record<string, Question[] | MultiQuestionSet[]> = {
    topic1: topic1,
    topic2: topic2,
    topic3: topic3,
    topic4: topic4,
    topic5: topic5,
    "q16-17": topicQ16_17, // Thêm topic mới
  };





  const currentDataSet = topics[activeTopic as keyof typeof topics] || [];
  const isMultiQuestionMode = activeTopic === "q16-17";

  // --- HÀM TẢI CÂU HỎI (CHO CẢ 2 CHẾ ĐỘ) ---
  const loadQuestionByIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= currentDataSet.length) return;

      setLoading(true);
      setManualIndex(index);
      const data = currentDataSet[index];

      if (isMultiQuestionMode) {
        // --- Tải Dạng Q16-17 ---
        const setData = data as MultiQuestionSet;
        setCurrentSet(setData);
        setQuestionData(null); // Xóa dữ liệu cũ

        const historyEntry = multiHistory[index];
        if (historyEntry) {
          setMultiSelectedAnswers(historyEntry.selectedAnswers);
          setIsMultiAnswerChecked(historyEntry.isAnswerChecked);
        } else {
          setMultiSelectedAnswers({});
          setIsMultiAnswerChecked(false);
          // (Không cần shuffle, vì các câu hỏi con đã cố định)
        }
      } else {
        // --- Tải Dạng Câu Đơn ---
        const questionData = data as Question;
        setQuestionData(questionData);
        setCurrentSet(null); // Xóa dữ liệu cũ

        const historyEntry = simpleHistory[index];
        if (historyEntry) {
          setSelectedAnswer(historyEntry.selectedAnswer);
          setIsAnswerChecked(historyEntry.isAnswerChecked);
          setShuffledOptions(historyEntry.shuffledOptions);
        } else {
          const newShuffledOptions = shuffleArray(questionData.options);
          setSelectedAnswer(null);
          setIsAnswerChecked(false);
          setShuffledOptions(newShuffledOptions);
          setSimpleHistory((prev) => ({
            ...prev,
            [index]: {
              selectedAnswer: null,
              isAnswerChecked: false,
              shuffledOptions: newShuffledOptions,
            },
          }));
        }
      }
      setLoading(false);
    },
    [currentDataSet, isMultiQuestionMode, simpleHistory, multiHistory, shuffleArray]
  );

  // --- HÀM XỬ LÝ CHO CÂU ĐƠN ---
  const handleSelectAnswer = (option: AnswerOption) => {
    if (isAnswerChecked) return;
    setSelectedAnswer(option);
    setSimpleHistory((prev) => ({
      ...prev,
      [manualIndex]: { ...prev[manualIndex], selectedAnswer: option },
    }));
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return;
    setIsAnswerChecked(true);
    setSimpleHistory((prev) => ({
      ...prev,
      [manualIndex]: { ...prev[manualIndex], isAnswerChecked: true },
    }));
  };

  // --- HÀM XỬ LÝ CHO Q16-17 ---
  const handleSelectMultiAnswer = (
    questionKey: string,
    option: AnswerOption
  ) => {
    if (isMultiAnswerChecked) return;
    const newSelectedAnswers = {
      ...multiSelectedAnswers,
      [questionKey]: option,
    };
    setMultiSelectedAnswers(newSelectedAnswers);
    setMultiHistory((prev) => ({
      ...prev,
      [manualIndex]: {
        ...prev[manualIndex],
        selectedAnswers: newSelectedAnswers,
        isAnswerChecked: false,
      },
    }));
  };

  const handleCheckMultiAnswer = () => {
    setIsMultiAnswerChecked(true);
    setMultiHistory((prev) => ({
      ...prev,
      [manualIndex]: {
        ...prev[manualIndex],
        isAnswerChecked: true,
      },
    }));
  };

  // --- HÀM ĐIỀU HƯỚNG ---
  const handleNextOrStart = () => {
    if (!questionData && !currentSet) { // Trường hợp "Start"
      loadQuestionByIndex(0);
    } else { // Trường hợp "Next"
      loadQuestionByIndex(manualIndex + 1);
    }
  };

  const handlePrevious = () => {
    loadQuestionByIndex(manualIndex - 1);
  };

  const handleChangeTopic = (topicId: string) => {
    setActiveTopic(topicId);
    setManualIndex(0);
    setQuestionData(null);
    setCurrentSet(null);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setMultiSelectedAnswers({});
    setIsMultiAnswerChecked(false);
    // Không cần xóa history, để người dùng có thể quay lại
  };

  // --- Hàm render cho các nút đáp án (dùng chung) ---
  const getButtonClasses = (
    option: AnswerOption,
    selectedOption: AnswerOption | null,
    isChecked: boolean
  ) => {
    const baseClasses =
      "w-full text-left p-4 rounded-lg border-2 transition-all duration-300 font-medium text-lg";
    if (isChecked) {
      if (option.isCorrect)
        return `${baseClasses} bg-green-100 border-green-500 text-green-800`;
      if (option.text === selectedOption?.text)
        return `${baseClasses} bg-red-100 border-red-500 text-red-800`;
      return `${baseClasses} bg-gray-100 border-gray-300 text-gray-600`;
    }
    if (option.text === selectedOption?.text)
      return `${baseClasses} bg-blue-500 border-blue-600 text-white`;
    return `${baseClasses} bg-white border-gray-300 hover:border-blue-500`;
  };

  // --- Component con để render một khối câu hỏi Q16-17 ---
  const QuestionBlock: React.FC<{
    question: Question;
    questionKey: string;
    selectedOption: AnswerOption | null;
    isBlockChecked: boolean;
    onSelect: (key: string, option: AnswerOption) => void;
  }> = ({
    question,
    questionKey,
    selectedOption,
    isBlockChecked,
    onSelect,
  }) => (
    <div className="mb-6">
      <p className="text-lg font-semibold mb-3 text-black">{question.question}</p>
      <div className="space-y-3">
        {question.options.map((opt) => (
          <button
            key={opt.text}
            onClick={() => onSelect(questionKey, opt)}
            disabled={isBlockChecked}
            className={getButtonClasses(opt, selectedOption, isBlockChecked)}
          >
            {opt.text}
          </button>
        ))}
      </div>
      {isBlockChecked && (
        <div className="mt-3 p-3 bg-gray-50 border rounded-lg text-black text-sm">
          <strong>Explanation:</strong> {question.explanation}
        </div>
      )}
    </div>
  );

  // --- GIAO DIỆN CHÍNH ---
  return (
    <div className="min-h-screen font-sans text-black flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold">Aptis Self-Study</h1>
          <p className="text-black mt-2">Manual English Practice</p>
        </header>

        {/* --- TAB CHỦ ĐỀ --- */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {[
            { id: "topic1", name: "Chủ đề thời gian" },
            { id: "topic2", name: "Chủ đề về số, giá tiền" },
            { id: "topic3", name: "Chủ đề về địa điểm" },
            { id: "topic4", name: "Chủ đề về hành động" },
            { id: "topic5", name: "Chủ đề khác" },
            { id: "q16-17", name: "Practice Q16-17" }, // Tab mới
          ].map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleChangeTopic(topic.id)}
              className={`px-4 py-2 rounded-md font-semibold ${
                activeTopic === topic.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              {topic.name}
            </button>
          ))}
        </div>

        {/* --- NÚT ĐIỀU HƯỚNG --- */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={handlePrevious}
            disabled={loading || manualIndex === 0 || (!questionData && !currentSet)}
            className="flex-1 px-6 py-3 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNextOrStart}
            disabled={
              loading ||
              ((questionData || currentSet) && manualIndex === currentDataSet.length - 1)
            }
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            <IconSparkles className="w-5 h-5 inline-block mr-2" />
            {loading
              ? "Loading..."
              : questionData || currentSet
              ? manualIndex === currentDataSet.length - 1
                ? "End of Topic"
                : "Next"
              : "Start Practice"}
          </button>
        </div>

        {/* --- NỘI DUNG CÂU HỎI (DYNAMIC) --- */}
        <div className="bg-white p-6 rounded-lg shadow min-h-[300px]">
          {loading && <Spinner />}

          {/* --- Trạng thái chờ --- */}
          {!loading && !questionData && !currentSet && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Please "Start Practice" to begin.</p>
            </div>
          )}

          {/* --- Giao diện Câu hỏi Đơn --- */}
          {!loading && isMultiQuestionMode === false && questionData && (
            <div>
              <p className="text-xl font-bold mb-4 text-black">
                {`Câu ${manualIndex + 1}/${currentDataSet.length}: ${
                  questionData.question
                }`}
              </p>
              <div className="space-y-3">
                {shuffledOptions.map((opt) => (
                  <button
                    key={opt.text}
                    onClick={() => handleSelectAnswer(opt)}
                    disabled={isAnswerChecked}
                    className={getButtonClasses(
                      opt,
                      selectedAnswer,
                      isAnswerChecked
                    )}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
              {!isAnswerChecked && (
                <button
                  onClick={handleCheckAnswer}
                  disabled={!selectedAnswer}
                  className="w-full mt-5 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
                >
                  Check Answer
                </button>
              )}
              {isAnswerChecked && (
                <div className="mt-4 p-4 bg-gray-50 border rounded-lg text-black">
                  <strong>Explanation:</strong> {questionData.explanation}
                </div>
              )}
            </div>
          )}

          {/* --- Giao diện Q16-17 --- */}
          {!loading && isMultiQuestionMode === true && currentSet && (
             <div>
              <h2 className="text-xl font-bold mb-4 text-black">
                {`Đề ${manualIndex + 1}/${currentDataSet.length}: ${currentSet.topic}`}
              </h2>
              
              {/* (Tùy chọn) Thêm trình phát âm thanh */}
              {currentSet.audioSrc && (
                <audio controls className="w-full mb-4">
                  <source src={currentSet.audioSrc} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              )}

              {/* Nhóm 16 */}
              <div className="p-4 border border-blue-200 rounded-lg mb-4">
                <h3 className="text-lg font-bold text-blue-700 mb-3">Question 16</h3>
                <QuestionBlock
                  question={currentSet.questionGroup16.question16_1}
                  questionKey="q16_1"
                  selectedOption={multiSelectedAnswers["q16_1"]}
                  isBlockChecked={isMultiAnswerChecked}
                  onSelect={handleSelectMultiAnswer}
                />
                <QuestionBlock
                  question={currentSet.questionGroup16.question16_2}
                  questionKey="q16_2"
                  selectedOption={multiSelectedAnswers["q16_2"]}
                  isBlockChecked={isMultiAnswerChecked}
                  onSelect={handleSelectMultiAnswer}
                />
              </div>

              {/* Nhóm 17 */}
              <div className="p-4 border border-indigo-200 rounded-lg mb-4">
                 <h3 className="text-lg font-bold text-indigo-700 mb-3">Question 17</h3>
                 <QuestionBlock
                  question={currentSet.questionGroup17.question17_1}
                  questionKey="q17_1"
                  selectedOption={multiSelectedAnswers["q17_1"]}
                  isBlockChecked={isMultiAnswerChecked}
                  onSelect={handleSelectMultiAnswer}
                />
                <QuestionBlock
                  question={currentSet.questionGroup17.question17_2}
                  questionKey="q17_2"
                  selectedOption={multiSelectedAnswers["q17_2"]}
                  isBlockChecked={isMultiAnswerChecked}
                  onSelect={handleSelectMultiAnswer}
                />
              </div>

              {/* Nút Check cho Q16-17 */}
              {!isMultiAnswerChecked && (
                <button
                  onClick={handleCheckMultiAnswer}
                  disabled={Object.keys(multiSelectedAnswers).length < 4} // Phải chọn đủ 4 đáp án
                  className="w-full mt-5 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
                >
                  Check All Answers
                </button>
              )}
             </div>
          )}

        </div>
      </main>
    </div>
  );
}
