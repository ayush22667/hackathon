import whisper
from gtts import gTTS
import os
import time
import random
import sounddevice as sd
import numpy as np
import pymongo
import wave

# Load Whisper Model at the beginning
whisper_model = whisper.load_model("base")  # or "small", "medium", "large"

print('Loading your AI Insurance Assistant - InsureBot')



# Connect to MongoDB
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client.insurance_bot
collection = db.customer_responses

# Function to Speak using gTTS
def speak(text):
    filename = f"response_{int(time.time())}.mp3"  # Generate unique filename
    tts = gTTS(text=text, lang='en')
    tts.save(filename)
    os.system(f"mpg321 {filename}")  # Use 'start {filename}' on Windows

# Function to Record Audio and Transcribe with Whisper
def takeCommand():
    print("Listening...")
    
    # Record audio
    duration = 5  # seconds
    samplerate = 44100  # Standard audio sampling rate
    audio = sd.rec(int(duration * samplerate), samplerate=samplerate, channels=1, dtype=np.int16)
    sd.wait()  # Wait until recording is finished

    # Save to WAV file
    temp_wav = "temp_audio.wav"
    with wave.open(temp_wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(samplerate)
        wf.writeframes(audio.tobytes())

    # Transcribe with Whisper
    result = whisper_model.transcribe(temp_wav)
    statement = result["text"].strip()
    print(f"User said: {statement}")
    
    return statement.lower()

# Function to Generate AI Response using Llama 2
# def ask_ai(question):
#     response = llama_model.create_completion(prompt=question, max_tokens=100)
#     return response["choices"][0]["text"].strip()
from transformers import pipeline

# Load a free text-generation model
generator = pipeline("text-generation", model="facebook/opt-1.3b")

def ask_ai(question):
    response = generator(question, max_length=100, num_return_sequences=1)
    return response[0]["generated_text"].strip()


# Store customer responses
customer_data = {}

# Function to Verify User's Name
def verify_name():
    while True:
        speak("May I know your full name?")
        customer_name = takeCommand()

        if customer_name:
            speak(f"Just to confirm, your name is {customer_name}. Is that correct?")
            confirmation = takeCommand()

            if "yes" in confirmation or "correct" in confirmation:
                customer_data["name"] = customer_name
                break
            else:
                speak("Let's try again.")

# Function to Verify Date of Birth
def verify_dob():
    while True:
        speak("Please provide your date of birth in DD-MM-YYYY format.")
        customer_dob = takeCommand()

        if customer_dob:
            speak(f"You said your date of birth is {customer_dob}. Is that correct?")
            confirmation = takeCommand()

            if "yes" in confirmation or "correct" in confirmation:
                customer_data["dob"] = customer_dob
                speak("Thank you. Your details have been verified. Let's proceed.")
                break
            else:
                speak("Let's try again.")

# Health conditions for structured questioning
health_conditions = {
    "diabetes": "Do you have high blood sugar or diabetes?",
    "blood_pressure": "Do you have high blood pressure or cholesterol?",
    "heart_disease": "Do you have any heart disease, heart surgery, or chest pain?",
    "respiratory_disease": "Do you have asthma, bronchitis, or other respiratory conditions?",
}

# Function to Ask AI-Generated Health Questions
def ask_health_questions():
    speak("Now, let's discuss your health conditions.")
    
    for condition, question in health_conditions.items():
        speak(question)
        response = takeCommand()

        if "yes" in response:
            customer_data[condition] = "Yes"
            follow_up = f"The user has {condition}. What follow-up questions should I ask?"
            ai_response = ask_ai(follow_up)
            speak(ai_response)
        elif "no" in response:
            customer_data[condition] = "No"
        else:
            speak("I didn't understand. Let's try again.")

# Function to Ask AI-Powered Lifestyle Questions
def ask_lifestyle_questions():
    speak("Now, let's discuss your lifestyle habits.")

    while True:
        speak("Do you smoke or consume alcohol?")
        lifestyle_response = takeCommand()

        if "yes" in lifestyle_response:
            speak("How frequently do you consume these substances?")
            frequency = takeCommand()
            ai_response = ask_ai(f"The user smokes or drinks {frequency} times. What should I ask next?")
            speak(ai_response)
            customer_data["lifestyle"] = {"habit": "smoking/alcohol", "frequency": frequency}
            break
        elif "no" in lifestyle_response:
            customer_data["lifestyle"] = "No harmful habits"
            speak("Great! No unhealthy habits recorded.")
            break
        else:
            speak("I didn't understand. Let's try again.")

# Function to Collect Medical History
def ask_medical_history():
    speak("Do you have any past surgeries or major illnesses?")
    medical_response = takeCommand()

    if "yes" in medical_response:
        speak("Please describe your medical history.")
        history = takeCommand()
        ai_response = ask_ai(f"The user had the following past medical conditions: {history}. What should I ask next?")
        speak(ai_response)
        customer_data["medical_history"] = history
    elif "no" in medical_response:
        customer_data["medical_history"] = "No major past conditions"
        speak("Good to know! No medical history recorded.")
    else:
        speak("I didn't understand. Moving on.")

# Function to Ask Insurance Preferences
def ask_insurance_preferences():
    speak("What type of insurance plan are you looking for?")
    insurance_plan = takeCommand()

    ai_response = ask_ai(f"The user is looking for {insurance_plan}. What recommendations should I provide?")
    speak(ai_response)

    customer_data["insurance_plan"] = insurance_plan

# Collect User Details
verify_name()
verify_dob()
ask_health_questions()
ask_lifestyle_questions()
ask_medical_history()
ask_insurance_preferences()

# Save Data to MongoDB
collection.insert_one(customer_data)
print("Customer data saved successfully!")

# End Conversation
speak("Thank you for providing your details. Your information has been recorded. Have a great day!")
