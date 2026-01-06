
import { GameState, Player, Card } from '@/types/game';
import { calculateRateChange, applyRateChange } from './rating';
import { discardPairs } from './gameLogic';
import { v4 as uuidv4 } from 'uuid';

export class GameManager {
    private state: GameState;

    constructor() {
        this.state = {
            id: uuidv4(),
            phase: 'LOBBY',
            players: [],
            currentTurnPlayerId: '', // Set when game starts
            deck: [],
            winners: [],
            roundCount: 0,
            lastDiscard: null,
            targetPlayerId: null
        };
    }

    getState(): GameState {
        return this.state;
    }

    join(name: string): Player {
        const existing = this.state.players.find(p => p.name === name);
        if (existing) return existing;

        const newPlayer: Player = {
            id: uuidv4(),
            name,
            hand: [],
            rank: null,
            previousRank: null,
            rate: 100, // Initial Rate
            rateHistory: [],
            isBot: false,
            finishedAt: null
        };

        this.state.players.push(newPlayer);
        // Sync new player list to clients is handled by caller via emitting 'update'
        return newPlayer;
    }

    start() {
        if (this.state.players.length < 2) return; // Need at least 2 players
        
        // 1. Create Deck
        const suits = ['spade', 'heart', 'diamond', 'club'] as const;
        const deck: Card[] = [];
        suits.forEach(suit => {
            for (let i = 1; i <= 13; i++) {
                deck.push({ suit, number: i, id: uuidv4() });
            }
        });
        deck.push({ suit: 'joker', number: 0, id: uuidv4() }); // Baba

        // 2. Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        // 3. Deal
        this.state.players.forEach(p => p.hand = []);
        let pIdx = 0;
        deck.forEach(card => {
            if (this.state.players[pIdx]) {
                this.state.players[pIdx].hand.push(card);
                pIdx = (pIdx + 1) % this.state.players.length;
            }
        });

        // 4. Discard Pairs
        this.state.players = this.state.players.map(p => {
             const { hand } = discardPairs(p.hand);
             return {
                ...p,
                hand,
                rank: null, // Reset rank
                finishedAt: null
            };
        });

        this.state.phase = 'PLAYING';
        this.state.currentTurnPlayerId = this.state.players[0].id;
        this.state.lastDiscard = null;
        this.updateTarget(this.state.currentTurnPlayerId);
    }

    draw(playerId: string, targetPlayerId: string, cardIndex?: number) {
        if (this.state.phase !== 'PLAYING') return;
        if (this.state.currentTurnPlayerId !== playerId) return;

        const currentPlayerIndex = this.state.players.findIndex(p => p.id === playerId);
        const targetPlayerIndex = this.state.players.findIndex(p => p.id === targetPlayerId);
        
        if (currentPlayerIndex === -1 || targetPlayerIndex === -1) return;

        const targetPlayer = this.state.players[targetPlayerIndex];
        if (targetPlayer.hand.length === 0) return;

        // Draw Logic
        const indexToDraw = cardIndex !== undefined ? cardIndex : Math.floor(Math.random() * targetPlayer.hand.length);
        if (indexToDraw >= targetPlayer.hand.length) return; // Basic bounds check

        const card = targetPlayer.hand[indexToDraw];

        // Reset highlight if it was teased
        if (card.isHighlighted) delete card.isHighlighted;

        // Move Card
        const newTargetHand = [...targetPlayer.hand];
        newTargetHand.splice(indexToDraw, 1);
        
        let newCurrentHand = [...this.state.players[currentPlayerIndex].hand, card];
        const { hand: processedHand, discarded } = discardPairs(newCurrentHand);

        // Update State
        this.state.players[targetPlayerIndex].hand = newTargetHand;
        this.state.players[currentPlayerIndex].hand = processedHand;

        // Set Last Discard for animation
        if (discarded.length > 0) {
            this.state.lastDiscard = {
                playerId,
                cards: discarded.map(c => ({ ...c }))
            };
        } else {
            this.state.lastDiscard = null;
        }

        // Check Finished
        this.checkFinished();

        // Advance Turn (if game is still ON)
        if (this.state.phase === 'PLAYING') {
            this.advanceTurn(currentPlayerIndex);
        }
    }

    tease(playerId: string, cardIndex: number) {
         const pIdx = this.state.players.findIndex(p => p.id === playerId);
         if (pIdx === -1) return;
         
         const player = this.state.players[pIdx];
         if (!player.hand[cardIndex]) return;

         // Toggle highlight
         const isHi = !!player.hand[cardIndex].isHighlighted;
         player.hand[cardIndex].isHighlighted = !isHi;
         
         // Clear others? Maybe only 1 at a time? 
         // For now, allow multiple or just toggle.
    }

    private checkFinished() {
         let finishedCount = this.state.players.filter(p => p.rank !== null).length;

         // We need to check everyone who might have finished this turn (Current and Target)
         // Actually, just iterating all active players is safer
         for (let i = 0; i < this.state.players.length; i++) {
             const p = this.state.players[i];
             if (p.rank === null && p.hand.length === 0) {
                 finishedCount++;
                 p.rank = finishedCount;
                 p.finishedAt = Date.now();
             }
         }

         // Check Game Over
         const activePlayers = this.state.players.filter(p => p.rank === null);
         if (activePlayers.length <= 1) {
             this.state.phase = 'FINISHED';
             if (activePlayers.length === 1) {
                 finishedCount++;
                 activePlayers[0].rank = finishedCount; // Last place
                 activePlayers[0].finishedAt = Date.now();
             }
             this.calculateRatings();
         }
    }

    private calculateRatings() {
        const isFirstGame = this.state.roundCount === 0;
        for (let i = 0; i < this.state.players.length; i++) {
            const p = this.state.players[i];
            if (p.rank) {
                const change = calculateRateChange(p.rate, p.rank, p.previousRank, isFirstGame);
                this.state.players[i] = applyRateChange(p, change);
                // Prepare for next game: rank becomes prevRank only after Reset?
                // Actually reset logic usually handles archiving rank to prevRank.
            }
        }
    }

    private advanceTurn(currentIndex: number) {
        // Find next player with cards to take turn
        let nextIndex = (currentIndex + 1) % this.state.players.length;
        let loops = 0;
        while (this.state.players[nextIndex].hand.length === 0 && loops < this.state.players.length) {
            nextIndex = (nextIndex + 1) % this.state.players.length;
            loops++;
        }
        
        let nextPlayerId = '';
        if (loops < this.state.players.length) {
            nextPlayerId = this.state.players[nextIndex].id;
        } else {
             // Everyone finished? handled by checkFinished
             return; 
        }

        this.state.currentTurnPlayerId = nextPlayerId;

        // Determine who the new current player should draw from
        this.updateTarget(nextPlayerId);
    }
    
    private updateTarget(currentTurnPlayerId: string) {
        const currentIdx = this.state.players.findIndex(p => p.id === currentTurnPlayerId);
        if (currentIdx === -1) return;

        // Typically in Baba Nuki you draw from the person to your RIGHT (Previous Index) or LEFT (Next Index).
        // Let's assume consistent rotation: If turn passes A -> B -> C, then B draws from C? Or B draws from A?
        // Standard: Draw from person to the RIGHT.
        // But implementation in page.tsx 'others[0]' logic implies grabbing from "next in list".
        // Let's stick to "Next Index" so it matches the turn order direction or simply "Next Active Player".
        
        // Let's implement: Draw from the NEXT ACTIVE player (Index + 1).
        let targetIndex = (currentIdx + 1) % this.state.players.length;
        let loops = 0;
        
        // Loop until we find someone with cards who isn't self (though self check implies cards > 0 anyway if we are playing)
        while (
            (this.state.players[targetIndex].hand.length === 0 || this.state.players[targetIndex].id === currentTurnPlayerId) 
            && loops < this.state.players.length
        ) {
            targetIndex = (targetIndex + 1) % this.state.players.length;
            loops++;
        }

        if (loops < this.state.players.length) {
            this.state.targetPlayerId = this.state.players[targetIndex].id;
        } else {
            this.state.targetPlayerId = null;
        }
    }

    reset(hardReset: boolean) {
        if (hardReset) {
             // Keep players but reset rates? OR just wipe everything?
             // Usually Hard Reset = Wipe everything.
             this.state.players = [];
             this.state.phase = 'LOBBY';
             this.state.roundCount = 0;
             this.state.deck = [];
             this.state.currentTurnPlayerId = '';
        } else {
            // Soft Reset (Next Round)
            this.state.roundCount++;
            
            this.state.deck = [];
            this.state.currentTurnPlayerId = '';
            
            // Archive Ranks
            this.state.players.forEach(p => {
                p.previousRank = p.rank;
                p.rank = null;
                p.hand = [];
                p.finishedAt = null;
            });
            
            // Start automatically? Or wait for "Start" again?
            // Usually wait for "Start Game" in lobby.
            this.state.phase = 'LOBBY'; 
        }
    }
}
