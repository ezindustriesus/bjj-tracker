// scripts/import-data.js
// Run: SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx node scripts/import-data.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Parsed from bjj_competition_results.csv
const rawData = [
  ["2026-02-21","Distinguished Gentleman 2","Springfield BJJ","Purple","Adult (18+)","Middleweight (175-200)","Suit","Regular","Dan Pinto Corral","Win","Triangle","","Silver"],
  ["2026-02-21","Distinguished Gentleman 2","Springfield BJJ","Purple","Adult (18+)","Middleweight (175-200)","Suit","Regular","Matt Williams","Loss","Heel Hook","","Silver"],
  ["2026-02-21","Distinguished Gentleman 2","Springfield BJJ","Purple","Adult (18+)","Middleweight (175-200)","Suit","Regular","Chris Iacob","Loss","Kill Shot (OT)","","Silver"],
  ["2026-01-31","2026 AGF Arkansas State Championships","AGF","Purple","Adult (18+)","Light (175)","Gi","Regular","Holden Wills","Win","Submission","","Silver"],
  ["2026-01-31","2026 AGF Arkansas State Championships","AGF","Purple","Adult (18+)","Light (175)","Gi","Regular","Holden Wills","Loss","Submission","5-2","Silver"],
  ["2026-01-31","2026 AGF Arkansas State Championships","AGF","Purple","Adult (18+)","Light (175)","Gi","Regular","Holden Wills","Loss","Submission","","Silver"],
  ["2026-01-31","2026 AGF Arkansas State Championships","AGF","Purple","Master 1 (30+)","Challenger I (175)","Gi","Challenger","Shane Miller","Win","Submission","","Gold"],
  ["2026-01-31","2026 AGF Arkansas State Championships","AGF","Purple","Master 1 (30+)","Light (175)","No Gi","Regular","Shane Miller","Win","Points","5-2","Gold"],
  ["2026-01-31","2026 AGF Arkansas State Championships","AGF","Purple","Master 1 (30+)","Light (175)","No Gi","Regular","Shane Miller","Win","Submission","","Gold"],
  ["2026-01-31","2026 AGF Arkansas State Championships","AGF","Purple","Master 1 (30+)","Challenger I (175)","No Gi","Challenger","Ashley Cox","Win","Submission","2-10","Gold"],
  ["2025-11-15","2025 US National Gi Championships","AGF","Purple","Master 1 (30+)","Light (175)","Gi","Regular","Johnny Pyron","Win","Submission","0-5","Silver"],
  ["2025-11-15","2025 US National Gi Championships","AGF","Purple","Master 1 (30+)","Light (175)","Gi","Regular","Christopher Campbell","Loss","Submission","","Silver"],
  ["2025-11-15","2025 US National Gi Championships","AGF","Purple","Master 1 (30+)","Challenger I (175)","Gi","Challenger","Christopher Campbell","Win","Points","2-10","Gold"],
  ["2025-10-18","2025 AGF Texas State Championships","AGF","Purple","Master 1 (30+)","Light (175)","Gi","Regular","Dillon Turner","Win","Points","0-5","Gold"],
  ["2025-10-18","2025 AGF Texas State Championships","AGF","Purple","Master 1 (30+)","Light (175)","Gi","Regular","Jose Barajas Tinoco","Win","Submission","","Gold"],
  ["2025-10-18","2025 AGF Texas State Championships","AGF","Purple","Master 1 (30+)","Challenger I (175)","Gi","Challenger","Micah Taylor","Loss","Submission","","Silver"],
  ["2025-10-18","2025 AGF Texas State Championships","AGF","Purple","Master 1 (30+)","Light (175)","No Gi","Regular","Micah Taylor","Loss","Points","8-3","Silver"],
  ["2025-10-18","2025 AGF Texas State Championships","AGF","Purple","Master 1 (30+)","Light (175)","No Gi","Regular","Tye Whatley","Win","Submission","","Silver"],
  ["2025-10-18","2025 AGF Texas State Championships","AGF","Purple","Master 1 (30+)","Challenger I (175)","No Gi","Challenger","Tye Whatley","Win","Submission","1-2","Gold"],
  ["2025-09-20","2025 AGF Oklahoma City Open","AGF","Purple","Master 1 (30+)","Light (175)","Gi","Regular","Justin Massey","Win","Submission","","Gold"],
  ["2025-09-20","2025 AGF Oklahoma City Open","AGF","Purple","Master 1 (30+)","Light (175)","Gi","Regular","Justin Massey","Win","Submission","","Gold"],
  ["2025-09-20","2025 AGF Oklahoma City Open","AGF","Purple","Master 1 (30+)","Challenger I (175)","Gi","Challenger","Timothy Waybright","Win","Points","1-2","Gold"],
  ["2025-09-20","2025 AGF Oklahoma City Open","AGF","Purple","Master 1 (30+)","Light (175)","No Gi","Regular","Justin Massey","Win","Submission","","Gold"],
  ["2025-09-20","2025 AGF Oklahoma City Open","AGF","Purple","Master 1 (30+)","Light (175)","No Gi","Regular","Justin Massey","Win","Submission","16-11","Gold"],
  ["2025-09-20","2025 AGF Oklahoma City Open","AGF","Purple","Adult (18+)","Challenger I (175)","No Gi","Challenger","Asher Urban","Loss","Submission","","5th"],
  ["2025-09-20","2025 AGF Oklahoma City Open","AGF","Purple","Adult (18+)","Heavy (220)","Gi","Regular","Chuck Denton","Loss","Submission","","Silver"],
  ["2025-09-20","2025 AGF Oklahoma City Open","AGF","Purple","Adult (18+)","Heavy (220)","Gi","Regular","Chuck Denton","Loss","Points","16-11","Silver"],
  ["2025-08-16","Distinguished Gentleman Tournament","Springfield BJJ","Purple","Masters","Light (175)","Suit","Regular","Adam Lopardo","Win","Overtime","0-14","Silver"],
  ["2025-08-16","Distinguished Gentleman Tournament","Springfield BJJ","Purple","Masters","Light (175)","Suit","Regular","Unknown","Loss","Armbar","2-14","Silver"],
  ["2025-07-26","NEWBREED Springfield Summer Championship","Newbreed","Purple","Masters","Middleweight (170-180)","Gi","Regular","Tim Owen","Win","Points","0-7","Gold"],
  ["2025-07-26","NEWBREED Springfield Summer Championship","Newbreed","Purple","Masters","Middleweight (170-180)","Gi","Regular","Tim Owen","Win","Points","0-14","Gold"],
  ["2025-06-28","2025 AGF Arkansas Open","AGF","Purple","Master 1 (30+)","Light (175)","Gi","Regular","Niall Blasdel","Win","Points","2-14","Gold"],
  ["2025-06-28","2025 AGF Arkansas Open","AGF","Purple","Master 1 (30+)","Light (175)","Gi","Regular","Niall Blasdel","Win","Points","3-15","Gold"],
  ["2025-06-28","2025 AGF Arkansas Open","AGF","Purple","Adult (18+)","Challenger I (175)","Gi","Challenger","Raven Harmon","Win","Submission","0-4","Silver"],
  ["2025-06-28","2025 AGF Arkansas Open","AGF","Purple","Adult (18+)","Challenger I (175)","Gi","Challenger","Ethan Cummings","Loss","Points","2-1","Silver"],
  ["2025-06-28","2025 AGF Arkansas Open","AGF","Purple","Master 1 (30+)","Light (175)","No Gi","Regular","Niall Blasdel","Win","Points","28-2","Silver"],
  ["2025-06-28","2025 AGF Arkansas Open","AGF","Purple","Master 1 (30+)","Light (175)","No Gi","Regular","Levi Henegar","Loss","Points","0-4","Silver"],
  ["2025-06-28","2025 AGF Arkansas Open","AGF","Purple","Adult (18+)","Challenger I (175)","No Gi","Challenger","Levi Henegar","Loss","Submission","","5th"],
  ["2025-06-01","Jiu Jitsu Outlet Jamboree","JJ Outlet","Purple","Masters","Light (175)","No Gi","Regular","Alex Stevens","Loss","Heel Hook","","Silver"],
  ["2025-05-17","2025 AGF Missouri State Championships","AGF","Purple","Master 1 (30+)","Light (175)","Gi","Regular","Stephen Koehne","Win","Submission","","Gold"],
  ["2025-05-17","2025 AGF Missouri State Championships","AGF","Purple","Master 1 (30+)","Light (175)","Gi","Regular","Stephen Koehne","Win","Submission","","Gold"],
  ["2025-05-03","2025 AGF Springfield Championships","AGF","Purple","Adult (18+)","Middle (190)","Gi","Regular","Kaden Heintz","Loss","Submission","6-9","Silver"],
  ["2025-05-03","2025 AGF Springfield Championships","AGF","Purple","Adult (18+)","Middle (190)","Gi","Regular","Kaden Heintz","Loss","Submission","","Silver"],
  ["2025-05-03","2025 AGF Springfield Championships","AGF","Purple","Adult (18+)","Challenger I (175)","Gi","Challenger","Raven Harmon","Win","Submission","","Gold"],
  ["2025-05-03","2025 AGF Springfield Championships","AGF","Purple","Adult (18+)","Middle (190)","No Gi","Regular","Kaden Heintz","Loss","Points","6-9","Silver"],
  ["2025-05-03","2025 AGF Springfield Championships","AGF","Purple","Adult (18+)","Middle (190)","No Gi","Regular","Kaden Heintz","Loss","Submission","","Silver"],
  ["2025-05-03","2025 AGF Springfield Championships","AGF","Purple","Adult (18+)","Challenger I (175)","No Gi","Challenger","Raven Harmon","Win","Submission","12-0","Gold"],
  ["2025-04-19","2025 US National No Gi Championships","AGF","Blue","Master 2 (35+)","Light (175)","No Gi","Regular","Nelvin Perrin","Win","Submission","","Gold"],
  ["2025-04-19","2025 US National No Gi Championships","AGF","Blue","Master 2 (35+)","Light (175)","No Gi","Regular","Nelvin Perrin","Win","Submission","","Gold"],
  ["2025-04-19","2025 US National No Gi Championships","AGF","Blue","Senior 1 (40+)","Challenger I (175)","No Gi","Challenger","Nelvin Perrin","Win","Points","12-0","Gold"],
  ["2025-03-15","2025 AGF Oklahoma State Championships","AGF","Blue","Master 1 (30+)","Light (175)","Gi","Regular","Patrick Ingersoll","Win","Submission","","Gold"],
  ["2025-03-15","2025 AGF Oklahoma State Championships","AGF","Blue","Master 1 (30+)","Light (175)","Gi","Regular","Patrick Ingersoll","Win","Submission","","Gold"],
  ["2025-03-15","2025 AGF Oklahoma State Championships","AGF","Blue","Adult (18+)","Challenger I (175)","Gi","Challenger","Mario Sanchez","Win","Submission","","Bronze"],
  ["2025-03-15","2025 AGF Oklahoma State Championships","AGF","Blue","Adult (18+)","Challenger I (175)","Gi","Challenger","Zachary Smith","Loss","Submission","","Bronze"],
  ["2025-03-15","2025 AGF Oklahoma State Championships","AGF","Blue","Adult (18+)","Challenger I (175)","Gi","Challenger","Matthew Mallard","Win","Submission","","Bronze"],
  ["2025-03-15","2025 AGF Oklahoma State Championships","AGF","Blue","Master 1 (30+)","Light (175)","No Gi","Regular","Patrick Ingersoll","Loss","Submission","","Silver"],
  ["2025-03-15","2025 AGF Oklahoma State Championships","AGF","Blue","Master 1 (30+)","Light (175)","No Gi","Regular","John Abakah","Win","Submission","","Silver"],
  ["2025-03-15","2025 AGF Oklahoma State Championships","AGF","Blue","Master 1 (30+)","Challenger I (175)","No Gi","Challenger","Joseph Duncan","Win","Submission","","Gold"],
  ["2025-03-15","2025 AGF Oklahoma State Championships","AGF","Blue","Master 1 (30+)","Challenger I (175)","No Gi","Challenger","Joseph Johnson","Win","Submission","","Gold"],
  ["2024-11-09","2024 St. Louis Open","AGF","Blue","Masters","Light (175)","Gi","Challenger I","Bryan Watkins","Win","Submission","","Gold"],
  ["2024-11-09","2024 St. Louis Open","AGF","Blue","Masters","Light (175)","Gi","Regular","Khazmo DeBoise Bey","Loss","Points","","Silver"],
  ["2024-11-09","2024 St. Louis Open","AGF","Blue","Masters","Light (175)","Gi","Regular","Bryan Watkins","Win","Points","","Silver"],
  ["2024-11-09","2024 St. Louis Open","AGF","Blue","Masters","Light (175)","No Gi","Challenger I","Khazmo DeBoise Bey","Loss","Points","","Silver"],
  ["2024-11-09","2024 St. Louis Open","AGF","Blue","Masters","Light (175)","No Gi","Regular","Khazmo DeBoise Bey","Loss","Points","","Silver"],
  ["2024-11-01","IBJJF Pan No-Gi Championship 2024","IBJJF","Blue","Master","Light (175)","No Gi","Regular","Joshua Couch Nichols","Loss","Points","","Gold"],
  ["2024-09-14","2024 Springfield Jiu Jitsu Championships","AGF","Blue","Masters","Light (175)","Gi","Regular","Matthew Mcalister","Win","Tie Breaker","","Silver"],
  ["2024-09-14","2024 Springfield Jiu Jitsu Championships","AGF","Blue","Masters","Light (175)","Gi","Regular","AUSTIN REECE","Loss","Points","","Silver"],
  ["2024-09-14","2024 Springfield Jiu Jitsu Championships","AGF","Blue","Masters","Light (175)","Gi","Challenger I","Matthew Mcalister","Win","Submission","","Gold"],
  ["2024-09-14","2024 Springfield Jiu Jitsu Championships","AGF","Blue","Masters","Light (175)","No Gi","Challenger I","C. J. Whitworth","Win","Submission","","Gold"],
  ["2024-09-14","2024 Springfield Jiu Jitsu Championships","AGF","Blue","Masters","Light (175)","No Gi","Regular","C. J. Whitworth","Win","Submission","","Silver"],
  ["2024-09-14","2024 Springfield Jiu Jitsu Championships","AGF","Blue","Masters","Light (175)","No Gi","Regular","AUSTIN REECE","Loss","Points","","Silver"],
  ["2024-08-30","IBJJF World Master Championship 2024","IBJJF","Blue","Master 2","Light (175)","Gi","Regular","Jason Wayne Paszek","Win","Points","","Silver"],
  ["2024-08-30","IBJJF World Master Championship 2024","IBJJF","Blue","Master 2","Light (175)","Gi","Regular","Jose Morin","Loss","Points","","Silver"],
  ["2024-08-03","Chewjitsu Open Branson 2024","Chewjitsu","Blue","Masters (35+)","A Weight","Gi","Regular","Rob Grondski","Win","Submission","","Silver"],
  ["2024-08-03","Chewjitsu Open Branson 2024","Chewjitsu","Blue","Masters (35+)","A Weight","Gi","Regular","Richard Kelnhofer","Loss","Submission","","Silver"],
  ["2024-08-03","Chewjitsu Open Branson 2024","Chewjitsu","Blue","Masters (35+)","A Weight","No Gi","Intermediate","Matt Sanders","Win","Submission","","Silver"],
  ["2024-08-03","Chewjitsu Open Branson 2024","Chewjitsu","Blue","Masters (35+)","A Weight","No Gi","Intermediate","William Sackman","Loss","Submission","","Silver"],
  ["2024-08-03","Chewjitsu Open Branson 2024","Chewjitsu","Blue","Masters (35+)","A Weight","No Gi","Intermediate","Joseph Wisler","Win","Submission","","Silver"],
  ["2024-07-20","2024 Tulsa Open","AGF","Blue","Masters","Light (175)","Gi","Regular","Kye Yocham","Win","Submission","","Gold"],
  ["2024-07-20","2024 Tulsa Open","AGF","Blue","Masters","Light (175)","Gi","Challenger I","Ray Penny","Win","Points","","Gold"],
  ["2024-07-20","2024 Tulsa Open","AGF","Blue","Masters","Light (175)","No Gi","Regular","Terik Jackson","Win","Submission","","Gold"],
  ["2024-07-20","2024 Tulsa Open","AGF","Blue","Masters","Light (175)","No Gi","Regular","Kye Yocham","Win","Points","","Gold"],
  ["2024-07-20","2024 Tulsa Open","AGF","Blue","Masters","Light (175)","No Gi","Challenger I","Kye Yocham","Win","Submission","","Gold"],
  ["2024-07-20","2024 Tulsa Open","AGF","Blue","Masters","Light (175)","No Gi","Challenger I","Beau DeArmon","Loss","Submission","","Silver"],
  ["2024-06-22","2024 Arkansas Open","AGF","Blue","Masters","Light (175)","Gi","Regular","Matthew Mcalister","Win","Tie Breaker","","Gold"],
  ["2024-06-22","2024 Arkansas Open","AGF","Blue","Masters","Light (175)","Gi","Challenger I","Josh Russell","Win","Submission","","Gold"],
  ["2024-06-22","2024 Arkansas Open","AGF","Blue","Masters","Light (175)","Gi","Challenger I","Matthew Mcalister","Win","Points","","Gold"],
  ["2024-06-22","2024 Arkansas Open","AGF","Blue","Masters","Light (175)","No Gi","Challenger I","Josh Russell","Win","Submission","","Gold"],
  ["2024-06-22","2024 Arkansas Open","AGF","Blue","Adult","Light (175)","No Gi","Regular","Dairren Evans","Win","Points","","Silver"],
  ["2024-06-22","2024 Arkansas Open","AGF","Blue","Adult","Light (175)","No Gi","Regular","Andrew Harrison","Loss","Submission","","Silver"],
  ["2024-05-04","2024 Springfield Open","AGF","Blue","Masters","Light (175)","Gi","Regular","Joshua Anderson","Win","Submission","","Gold"],
  ["2024-05-04","2024 Springfield Open","AGF","Blue","Masters","Light (175)","Gi","Regular","Jerry Engeman","Win","Submission","","Gold"],
  ["2024-05-04","2024 Springfield Open","AGF","Blue","Masters","Light (175)","Gi","Challenger I","Stephen Wingard","Loss","Submission","","Silver"],
  ["2024-05-04","2024 Springfield Open","AGF","Blue","Masters","Light (175)","Gi","Challenger I","Jerry Engeman","Win","Submission","","Silver"],
  ["2024-05-04","2024 Springfield Open","AGF","Blue","Masters","Light (175)","No Gi","Challenger I","Jerry Engeman","Win","Submission","","Gold"],
  ["2024-05-04","2024 Springfield Open","AGF","Blue","Masters","Light (175)","No Gi","Challenger I","Adam Neugebauer","Win","Submission","","Gold"],
  ["2024-05-04","2024 Springfield Open","AGF","Blue","Masters","Light (175)","No Gi","Regular","Jerry Engeman","Win","Submission","","Gold"],
  ["2024-04-06","2024 Oklahoma City Open","AGF","Blue","Adult","Light (175)","Gi","Challenger I","James McLean","Win","Disqualification","","Gold"],
  ["2024-04-06","2024 Oklahoma City Open","AGF","Blue","Adult","Light (175)","Gi","Regular","Nick Summerlin","Win","Tie Breaker","","Gold"],
  ["2024-04-06","2024 Oklahoma City Open","AGF","Blue","Adult","Light (175)","Gi","Regular","Michael Halsey","Win","Points","","Gold"],
  ["2024-04-06","2024 Oklahoma City Open","AGF","Blue","Adult","Light (175)","No Gi","Challenger I","Gage Nolan","Loss","Submission","",""],
  ["2024-04-06","2024 Oklahoma City Open","AGF","Blue","Adult","Light (175)","No Gi","Regular","Michael Halsey","Loss","Submission","","Silver"],
  ["2024-03-20","IBJJF Pan Championship 2024","IBJJF","Blue","Master","Light (175)","Gi","Regular","William Ambrose Duggan","Loss","Points","","Silver"],
  ["2024-03-02","2024 Arkansas State Championships","AGF","Blue","Masters","Light (175)","Gi","Regular","James Sneed","Loss","Submission","","Silver"],
  ["2024-03-02","2024 Arkansas State Championships","AGF","Blue","Masters","Light (175)","Gi","Challenger I","Jerry Engeman","Win","Submission","","Silver"],
  ["2024-03-02","2024 Arkansas State Championships","AGF","Blue","Masters","Light (175)","Gi","Challenger I","James Sneed","Loss","Submission","","Silver"],
  ["2024-03-02","2024 Arkansas State Championships","AGF","Blue","Masters","Light (175)","No Gi","Challenger I","Josh Nguyen","Win","Submission","","Silver"],
  ["2024-03-02","2024 Arkansas State Championships","AGF","Blue","Masters","Light (175)","No Gi","Challenger I","James Sneed","Loss","Submission","","Silver"],
  ["2024-03-02","2024 Arkansas State Championships","AGF","Blue","Masters","Light (175)","No Gi","Challenger I","Patrick Phillips","Win","Points","","Silver"],
  ["2024-03-02","2024 Arkansas State Championships","AGF","Blue","Masters","Light (175)","No Gi","Regular","Terik Jackson","Win","Submission","","Gold"],
  ["2024-03-02","2024 Arkansas State Championships","AGF","Blue","Masters","Light (175)","No Gi","Regular","James Sneed","Win","Submission","","Gold"],
  ["2023-12-09","2023 US Open","AGF","Blue","Masters","Light (175)","No Gi","Regular","Chase Benedict","Win","Submission","","Gold"],
  ["2023-12-09","2023 US Open","AGF","Blue","Masters","Light (175)","No Gi","Regular","Turk Escalada","Win","Points","","Gold"],
  ["2023-12-09","2023 US Open","AGF","Blue","Masters","Light (175)","No Gi","Regular","Kenneth Burns","Win","Points","","Gold"],
  ["2023-12-09","2023 US Open","AGF","Blue","Masters","Light (175)","No Gi","Challenger I","Ross Lawrence","Win","Points","","Gold"],
  ["2023-12-09","2023 US Open","AGF","Blue","Masters","Light (175)","No Gi","Challenger I","Turk Escalada","Win","Points","","Gold"],
  ["2023-12-09","2023 US Open","AGF","Blue","Masters","Light (175)","Gi","Regular","Austin Villa","Win","Submission","","Silver"],
  ["2023-12-09","2023 US Open","AGF","Blue","Masters","Light (175)","Gi","Regular","Aaron Palan","Loss","Points","","Silver"],
  ["2023-12-09","2023 US Open","AGF","Blue","Masters","Light (175)","Gi","Challenger I","Austin Villa","Win","Points","","Silver"],
  ["2023-12-09","2023 US Open","AGF","Blue","Masters","Light (175)","Gi","Challenger I","Aaron Palan","Loss","Submission","","Silver"],
  ["2023-11-11","2023 St. Louis Open","AGF","Blue","Masters","Light (175)","Gi","Challenger I","Cameron Kirmse","Loss","Points","","Silver"],
  ["2023-11-11","2023 St. Louis Open","AGF","Blue","Masters","Light (175)","Gi","Challenger I","Matthew Salmi","Loss","Points","","Silver"],
  ["2023-11-11","2023 St. Louis Open","AGF","Blue","Masters","Light (175)","Gi","Regular","Kyle Morrison","Loss","Submission","","Gold"],
  ["2023-11-11","2023 St. Louis Open","AGF","Blue","Adult","Light (175)","No Gi","Challenger I","Dylan Meier","Win","Submission","","Silver"],
  ["2023-11-11","2023 St. Louis Open","AGF","Blue","Adult","Light (175)","No Gi","Challenger I","Nick Hebenstreit","Loss","Submission","","Silver"],
  ["2023-11-11","2023 St. Louis Open","AGF","Blue","Masters","Light (175)","No Gi","Regular","Jake Sevits","Win","Points","","Gold"],
  ["2023-11-11","2023 St. Louis Open","AGF","Blue","Masters","Light (175)","No Gi","Regular","Ioan Cristian Chirila","Win","Ref Decision","","Gold"],
  ["2023-10-21","2023 Texas State Championships","AGF","Blue","Masters","Light (175)","No Gi","Regular","Christopher Beasley","Win","Points","","Gold"],
  ["2023-10-21","2023 Texas State Championships","AGF","Blue","Masters","Light (175)","No Gi","Regular","Hunter Haught","Win","Submission","","Gold"],
  ["2023-10-21","2023 Texas State Championships","AGF","Blue","Masters","Light (175)","Gi","Regular","Colby Venters","Win","Points","","Silver"],
  ["2023-10-21","2023 Texas State Championships","AGF","Blue","Masters","Light (175)","Gi","Regular","Christopher Beasley","Loss","Submission","","Silver"],
  ["2023-10-21","2023 Texas State Championships","AGF","Blue","Masters","Light (175)","No Gi","Challenger I","Kenneth Burns","Win","Points","","Gold"],
  ["2023-10-21","2023 Texas State Championships","AGF","Blue","Masters","Light (175)","No Gi","Challenger I","Aaron Bidwell","Win","Points","","Gold"],
  ["2023-10-21","2023 Texas State Championships","AGF","Blue","Masters","Light (175)","Gi","Challenger I","Kenneth Burns","Win","Points","","Gold"],
  ["2023-10-21","2023 Texas State Championships","AGF","Blue","Masters","Light (175)","Gi","Challenger I","Zach Shaver","Win","Submission","","Gold"],
  ["2023-04-29","2023 Springfield Open","AGF","White","Adult","Light (175)","No Gi","Challenger I","Carson Kennedy","Loss","Submission","","Silver"],
  ["2023-04-29","2023 Springfield Open","AGF","White","Masters","Light (175)","No Gi","Regular","Blake Miller","Win","Points","","Silver"],
  ["2023-04-29","2023 Springfield Open","AGF","White","Masters","Light (175)","No Gi","Regular","Jeremy Gage","Win","Points","","Silver"],
  ["2023-04-29","2023 Springfield Open","AGF","White","Masters","Light (175)","No Gi","Regular","Kolbie Tafoya","Loss","Submission","","Silver"],
  ["2023-04-29","2023 Springfield Open","AGF","White","Masters","Light (175)","Gi","Regular","Blake Miller","Win","Submission","","Gold"],
  ["2023-04-29","2023 Springfield Open","AGF","White","Masters","Light (175)","Gi","Regular","Jeremy Gage","Win","Points","","Gold"],
  ["2023-04-29","2023 Springfield Open","AGF","White","Adult","Light (175)","Gi","Challenger I","Kolbie Tafoya","Win","Submission","","Gold"],
  ["2023-04-29","2023 Springfield Open","AGF","White","Adult","Light (175)","Gi","Challenger I","Joshua Cummings","Win","Submission","","Gold"],
  ["2023-03-18","2023 Arkansas Open","AGF","White","Masters","Light (175)","No Gi","Regular","Nathan Ragsdell","Win","Submission","","Gold"],
  ["2023-03-18","2023 Arkansas Open","AGF","White","Masters","Light (175)","No Gi","Regular","Ethan Rawlings","Win","Submission","","Gold"],
  ["2023-03-18","2023 Arkansas Open","AGF","White","Masters","Light (175)","Gi","Challenger I","Billy Chavez","Win","Points","","Gold"],
  ["2023-03-18","2023 Arkansas Open","AGF","White","Masters","Light (175)","Gi","Challenger I","William Lyons","Win","Submission","","Gold"],
  ["2023-03-18","2023 Arkansas Open","AGF","White","Masters","Light (175)","Gi","Regular","William Lyons","Win","Submission","","Gold"],
  ["2023-03-18","2023 Arkansas Open","AGF","White","Masters","Light (175)","Gi","Regular","Billy Chavez","Win","Points","","Gold"],
  ["2023-03-18","2023 Arkansas Open","AGF","White","Masters","Light (175)","No Gi","Challenger I","Anthony Alexander","Loss","Points","","Silver"],
  ["2022-09-10","2022 Oklahoma City Open","AGF","White","Masters","Middle (190)","No Gi","Regular","John Winfree","Win","Points","","Silver"],
  ["2022-09-10","2022 Oklahoma City Open","AGF","White","Masters","Middle (190)","No Gi","Regular","Kyle Lindenauer","Loss","Points","","Silver"],
  ["2022-07-31","IBJJF New Orleans Summer Open 2022","IBJJF","White","Master","Light (175)","Gi","Regular","Unknown","Win","Arm Triangle","","Silver"],
  ["2022-07-31","IBJJF New Orleans Summer Open 2022","IBJJF","White","Master","Light (175)","Gi","Regular","Xavier Z Jones","Loss","Points","","Silver"],
  ["2022-07-16","2022 Tulsa Open","AGF","White","Masters","Medium Heavy (205)","Gi","Regular","Peyton Berry","Win","Points","","Silver"],
  ["2022-07-16","2022 Tulsa Open","AGF","White","Masters","Medium Heavy (205)","No Gi","Regular","Aaron Mcguire","Win","Points","","Silver"],
  ["2022-07-16","2022 Tulsa Open","AGF","White","Masters","Medium Heavy (205)","Gi","Regular","Nathan Harris","Loss","Points","7-0","Silver"],
  ["2022-07-16","2022 Tulsa Open","AGF","White","Masters","Medium Heavy (205)","No Gi","Regular","Benjamin Morrell","Loss","Points","","Silver"],
  ["2019-12-08","Grappling Industries Kansas City","Grappling Industries","White","Master (30+)","-185 lbs","Gi","Round Robin","Lee Clark","Win","Submission","","Gold"],
  ["2019-12-08","Grappling Industries Kansas City","Grappling Industries","White","Master (30+)","-185 lbs","Gi","Round Robin","Christopher Martini","Win","Points","7-0","Gold"],
  ["2019-12-08","Grappling Industries Kansas City","Grappling Industries","White","Adult","-185 lbs","No Gi","Round Robin","Tanner Pettet","Loss","Walkover","","7th"],
  ["2019-12-08","Grappling Industries Kansas City","Grappling Industries","White","Adult","-185 lbs","No Gi","Round Robin","Nick Kyte","Loss","Walkover","","7th"],
  ["2019-12-08","Grappling Industries Kansas City","Grappling Industries","White","Adult","-185 lbs","No Gi","Round Robin","Diego Barra","Loss","Walkover","","7th"],
  ["2019-12-08","Grappling Industries Kansas City","Grappling Industries","White","Adult","-185 lbs","No Gi","Round Robin","Nathan Phan","Loss","Walkover","","7th"],
  ["2019-09-25","Springfield Open at Baptist Bible College","Fuji BJJ","White","Masters","Light (175)","Gi","Regular","Unknown","Win","Points","","Gold"],
  ["2019-09-25","Springfield Open at Baptist Bible College","Fuji BJJ","White","Masters","Light (175)","Gi","Regular","Unknown","Win","Walkover","","Gold"],
]

const columns = ['date','tournament','organization','belt','age_division','weight_class','gi_nogi','division_type','opponent','result','method','score','medal']

async function importData() {
  console.log(`Importing ${rawData.length} matches...`)
  
  const records = rawData.map(row => {
    const obj = {}
    columns.forEach((col, i) => {
      obj[col] = row[i] || null
    })
    // Clean empty strings to null
    Object.keys(obj).forEach(k => {
      if (obj[k] === '') obj[k] = null
    })
    return obj
  })

  // Import in batches of 50
  const batchSize = 50
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const { error } = await supabase.from('matches').insert(batch)
    if (error) {
      console.error(`Error on batch ${i}-${i+batchSize}:`, error.message)
    } else {
      console.log(`✓ Imported batch ${i+1}-${Math.min(i+batchSize, records.length)}`)
    }
  }
  
  const { count } = await supabase.from('matches').select('*', { count: 'exact', head: true })
  console.log(`\n✅ Done! Total records in DB: ${count}`)
}

importData().catch(console.error)
