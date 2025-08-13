
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sort"
	"sync"
)
type ScoreEntry struct {
	Username string `json:"username"`
	Score    int    `json:"score"`
}


type Leaderboard struct {
	mu     sync.Mutex
	scores map[string]int // Map of username to score
}

// NewLeaderboard creates a new, initialized Leaderboard.
func NewLeaderboard() *Leaderboard {
	return &Leaderboard{
		scores: make(map[string]int),
	}
}

// updateHandler receives a score update and adds it to the leaderboard.
func (l *Leaderboard) updateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var entry ScoreEntry
	if err := json.NewDecoder(r.Body).Decode(&entry); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	
	l.mu.Lock()
	l.scores[entry.Username] += entry.Score
	l.mu.Unlock() 

	log.Printf("Updated score for %s. New score: %d", entry.Username, l.scores[entry.Username])
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}


func (l *Leaderboard) getHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET method is allowed", http.StatusMethodNotAllowed)
		return
	}

	l.mu.Lock()

	var sortedScores []ScoreEntry
	for username, score := range l.scores {
		sortedScores = append(sortedScores, ScoreEntry{Username: username, Score: score})
	}
	l.mu.Unlock()

	// Sort the slice in descending order of score.
	sort.Slice(sortedScores, func(i, j int) bool {
		return sortedScores[i].Score > sortedScores[j].Score
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sortedScores)
}

func main() {
	leaderboard := NewLeaderboard()
	http.HandleFunc("/update", leaderboard.updateHandler)
	http.HandleFunc("/leaderboard", leaderboard.getHandler)

	log.Println("Go leaderboard microservice running on :4000")
	log.Fatal(http.ListenAndServe(":4000", nil))
}