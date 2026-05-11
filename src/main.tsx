import './index.css';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI with a guard
const apiKey = process.env.GEMINI_API_KEY;

document.addEventListener('DOMContentLoaded', () => {
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing. Please set it in your secrets.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey || "" });

  // DOM Elements
  const roleInput = document.getElementById('role') as HTMLInputElement;
  const targetInput = document.getElementById('target') as HTMLInputElement;
  const goalSelect = document.getElementById('goal') as HTMLSelectElement;
  const toneSelect = document.getElementById('tone') as HTMLSelectElement;
  const platformTabs = document.querySelectorAll('.platform-tab');
  const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
  const placeholderState = document.getElementById('placeholder-state') as HTMLDivElement;
  const outputSection = document.getElementById('output-section') as HTMLDivElement;
  const outputText = document.getElementById('output-text') as HTMLDivElement;
  const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
  const usageModal = document.getElementById('usage-modal') as HTMLDivElement;
  const dismissModalBtn = document.getElementById('dismiss-modal-btn') as HTMLButtonElement;

  let selectedPlatform = 'Twitter';

  // Platform Tab Logic
  platformTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // UI Update
      platformTabs.forEach(t => {
        t.classList.remove('tab-active', 'bg-[#6C63FF]', 'text-white', 'shadow-lg');
        t.classList.add('text-white/40', 'hover:bg-white/5');
      });
      tab.classList.add('tab-active', 'bg-[#6C63FF]', 'text-white', 'shadow-lg');
      tab.classList.remove('text-white/40', 'hover:bg-white/5');
      
      // State Update
      selectedPlatform = tab.getAttribute('data-platform') || 'Twitter';
    });
  });

  // Usage Tracking
  function checkUsage(): boolean {
    const today = new Date().toDateString();
    const lastUsed = localStorage.getItem('dm_last_used');
    const count = parseInt(localStorage.getItem('dm_count') || '0', 10);

    if (lastUsed === today && count >= 1) {
      return false; // Limit reached
    }
    return true;
  }

  function incrementUsage() {
    const today = new Date().toDateString();
    localStorage.setItem('dm_last_used', today);
    localStorage.setItem('dm_count', '1');
  }

  // Modal Logic
  function showModal() {
    usageModal.classList.remove('hidden');
  }

  dismissModalBtn.addEventListener('click', () => {
    usageModal.classList.add('hidden');
  });

  // Generation Logic
  generateBtn.addEventListener('click', async () => {
    if (!apiKey) {
      alert("API Key missing. Please configure GEMINI_API_KEY in Settings > Secrets.");
      return;
    }

    if (!roleInput.value || !targetInput.value) {
      alert('Please fill in your role and who you are DMing.');
      return;
    }

    if (!checkUsage()) {
      showModal();
      return;
    }

    // Loading state
    const originalBtnText = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="animate-spin text-xl">⚡</span> Writing...';
    
    try {
      const prompt = `Role: ${roleInput.value}
Target: ${targetInput.value}
Goal: ${goalSelect.value}
Platform: ${selectedPlatform}
Tone: ${toneSelect.value}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a cold outreach expert who writes short, high-converting DMs. Based on the user's role, target, goal, platform, and tone — write ONE DM that feels human, not salesy. Keep it under 5 lines. No emojis unless the platform is Instagram. End with a soft CTA, not a hard sell. Format: just the DM text, nothing else.",
        }
      });

      const dm = response.text || "Something went wrong. Please try again.";
      
      // Display Output
      placeholderState.classList.add('hidden');
      outputText.textContent = dm;
      outputSection.classList.remove('hidden');

      incrementUsage();
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Failed to generate DM. Please check your connection and try again.");
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = originalBtnText;
    }
  });

  // Copy Logic
  copyBtn.addEventListener('click', () => {
    const text = outputText.textContent || "";
    navigator.clipboard.writeText(text).then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "Copied ✓";
      copyBtn.classList.add('bg-green-500/20', 'border-green-500/30', 'text-green-400');
      
      setTimeout(() => {
        copyBtn.textContent = "Copy to Clipboard";
        copyBtn.classList.remove('bg-green-500/20', 'border-green-500/30', 'text-green-400');
      }, 2000);
    });
  });
});
