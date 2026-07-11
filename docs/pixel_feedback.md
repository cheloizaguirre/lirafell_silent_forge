# Art and gameplay feedback

### 1 · Entrance Hall (static — no flag states)

- room needs an initial description when entering
- writing desk hover box is too small
- door hover box is too low and maybe a bit too small
- clicking on the desk prints both the note and the following message about "the note says nothing new". Probably a remnant of the old text area that held everything. 
  - Fix: merge the message for "the note says nothing new". Print the whole message every time the desk is clicked

## 2 · Workshop Floor (pre-solve state)

- needs an initial description when entering
- move workbench to the left so the door doesn't overlap on it
- move guardian a bit to the right so it's not so close to the door to the archive
- move the pipe assembly lower so it's knee-high the ground
- make vault door bigger, it lools like the door to a safe, not another room
- resize vault door hover highlight

## 3 · Gallery of Automatons

- needs initial description when entering
- remove case-light halo, it's confusing
- reduce the frequency of eye pulsing, so it's less obvious
- add a dummy clickable area to each display case "look behind case". All of them except the one for the hound just say "Nothing here but dust and cobwebs." The hound one has a paper note tha reveals the caption
- new state: hide the caption until someone finds the piece of paper. There's no more plaque, but still show the text that used to be for the plaque.
- the text when solving the puzzle is wrong. It just says that the butler doesn't react. Solving the puzzle should have an additional text that inside the butler they find the heart.

## 4 · Archive & Study

- needs initial description when entering
- lens hovering box needs resizing
- clicking the lens has the same issue as room 1 with the multiple messages in a row. Same fix, make it print just one message with merged text 
- incorrect guesses should make noise because the books are "resetting"
- lilke in room 3, add two clickable areas to the top two shelfs of the bookshelf, one of them has nothing but dust, the other reveals the clue from the plaque. Clue should remain hidden until players find it.

## 5 · Getting caught (Workshop → Prison Cell)

- the prison room does have a good initial description
- big refactor to this part
    - workshop:
        - remove the faded numbers
        - when they put a wrong sequence, show 1, 2 , 3, or 4 BANG depending on the numbers they got wrong 
        - after they've been to the prison and escaped, a small hatch on the floor goes back to the prison on the other side of the bars
    - prison:
        - add a desk to be on the other side of the bars and say that there's a key on the desk that is just out of reach
        - make the cot clickable and say that a nap would sound great under different circumstances
        - add a clickhable loose brick that after 3 clicks becomes removeable
        - in the space left behind the brick, there's another notes with the numbers 2-0-1-3
        - correded floor gate animation happens only when clicking it
        - escaping remains the same

## 6 · Workshop (solve the valves)

- no changes

## 7 · The Vault (placements)

- needs initial description when entering
- containment rink is too large and spills into the floor. Make floor smaller or resize and move the ring and the sockets. This will also leave more room for the diamong sigils and labels
- move the door to the spire to appear in the vault instead of in the workshop

## 8 · The Aether Spire

- if the vault is entered at after the lever is thrown point, change the initial text of the vault to mention the spire armed diamong is active

## 9 · Workshop (vent the pressure)

- after venting the pressue, change the initial text of the vault to mention the pressure vented diamond is active

## 10 · Archive (align the lens)

- the lens has overlapping hover zones, one of them is not valid anymore, leave only the one for "realign the lens"
- clicking "lock alignment should close the modal window

## 11 · Spire revisit (optional but satisfying)

- no notes

## 12 · The Vault (convergence)

- change initial text to mention all diamonds are active
- there is no graphic for "activate the converge" but the hover box is there. 
- change victory banner to be in all caps

## Final thoughts

- most rooms need better messages for when "a player walks in"
- valve puzzle was too easy with the faded text right there, so moved to the prison
- if easy to do know, add a DM override to show or hide the colossues warden in the workshop (tie-in to a future feature where the warden can do a "jump scare" when players make noise)
- the key to the locked cabinet is nowhere to be found! we need to add a "harder" puzzle later that doesn't require us to create more scenes. This should be an optional reward for players that pay attention to details
- the SVG originals can stay as references, but no longer drive the development, they're just there in case we forget something, but they won't be taken as the authoritative answer