# Memorization & Spaced Repetition App

A focused memorization platform for **Hadith**, **Qur’an**, and **Islamic scholarly statements**, built around **Anki-style spaced repetition** and **distraction-free recall**.

This app is designed for students who want **long-term retention**, not surface-level exposure.

---

## Core Purpose

- Memorize and retain:
  - Hadith (with narrator and source)
  - Qur’anic verses
  - Mawqūf and Maqṭū‘ statements
- Review content using **Anki’s SM-2 spaced repetition algorithm**
- Enforce **active recall**, not passive reading

---

## Spaced Repetition System

The app follows an **Anki-style SM-2 algorithm**, not a simplified custom scheduler.

Each item tracks:
- Ease Factor (EF)
- Interval (days)
- Repetition count
- Next review date
- Review history

### Review ratings
- Again  
- Hard  
- Good  
- Easy  

Scheduling behavior mirrors Anki:
- New items enter a learning phase
- Failed items reappear sooner
- Easy items grow aggressively
- Ease factor is bounded to prevent collapse

---

## Memorization Item Structure

### Hadith
- **Narrator** (e.g. Abu Hurayrah, Ibn ‘Umar)
- **Matn / Nass** (Arabic text)
- **Source** (e.g. Sahih al-Bukhari, Muslim)
- Optional translation

### Mawqūf / Maqṭū‘
- **Speaker name**
- **Text**
- **Source**

### Qur’an
- **Surah name**
- **Ayah number or range**
- **Ayah text**
- Optional translation

Each field is intentionally separated to prevent ambiguity and accidental hints.

---

## Categories

Categories are **structured selections**, not free text.

### Available categories
- Aqeedah  
- Fiqh  
- Mustalah Al-Hadith  
- Tafsir  
- Manners  
- Heart-Softener  
- Hadith  
- Usool  
- Al-Fiqh  

### Category behavior
- Optional
- Select none, one, or multiple
- Displayed during review as a **contextual hint**
- Never reveal memorized text

---

## Review Experience

- The **main memorized text** is always:
  - Hidden or blurred by default
  - Revealed only after user action

### Always visible during review (before reveal)
- Hadith → Narrator  
- Mawqūf / Maqṭū‘ → Speaker name  
- Qur’an → Surah name + Ayah number  
- Selected categories (as intentional hints)

### Hidden until reveal
- Matn / verse / quote
- Source
- Translation

This enforces **pure recall** while preserving identity context.

---

## Design Principles

- No social features
- No feeds
- No notifications designed for engagement loops
- Minimal UI
- Daily-use focused
- Recall over recognition

This is a **study tool**, not a content platform.

---

## Intended Use

- Daily memorization and revision
- Long-term retention of core texts
- Serious students of Islamic knowledge

---

## Status

This project is an MVP focused on correctness, clarity, and retention accuracy.  
Future additions will only be considered if they do not compromise recall quality.
