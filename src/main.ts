import {
	addChildren,
	removeChildren,
	toggleClasses,
	newElement,
	shuffle,
} from "./utils";

import { Cards, CardMatchDict, Player } from "./types";

import { FlipCard } from "./components/flip-card";
import { PlayerSpot } from "./components/player-spot";

import animalDeck from "../data/animalDeck.json";

// Test area

// Round Counter

let roundsPlayed: number = 0;
const roundBoard = document.getElementById("round-board") as HTMLElement;

function roundCounter() {
	roundsPlayed++;
	console.log(roundsPlayed);

	removeChildren(roundBoard);
	const element: HTMLElement = newElement("div");
	element.innerHTML = `Round: ${roundsPlayed}`;

	addChildren(roundBoard, [element]);
	// check if all players have had a turn and if so increase RoundCounter
}

//////////////////////////////////////////
/// Prepare Game Board & Initial State ///
//////////////////////////////////////////

const cardGrid = document.getElementById("card-grid") as HTMLElement;

const playerAreaLeft = document.getElementById(
	"player-area-left"
) as HTMLElement;
const playerAreaRight = document.getElementById(
	"player-area-right"
) as HTMLElement;

let selectedCards: Array<HTMLElement> = [];

let sequenceLength = 2;

const players: Array<Player> = [
	{
		name: "Example Jane",
		order: 1,
		score: 0,
	},
	{
		name: "Example Steve",
		order: 2,
		score: 0,
	},
	{
		name: "Example Maxine",
		order: 3,
		score: 0,
	},
	{
		name: "Example Phillip",
		order: 4,
		score: 0,
	},
];

function renderScore() {
	const scoreElement = document.querySelector(
		`#player-${playerTurn + 1} .player-score`
	) as HTMLElement;

	scoreElement.innerText = `${players[playerTurn].score}`;
}

let playerTurn: number = 0;

function nextTurn() {
	const prevPlayerTurn: number = playerTurn;
	const nextPlayerTurn: number = (playerTurn + 1) % players.length;

	if (nextPlayerTurn == 0) roundCounter();

	renderScore();

	playerTurn = nextPlayerTurn;

	// change color of player's container indicating who's turn it is
	const prevPlayerElement = document.querySelector(
		`#player-${prevPlayerTurn + 1}`
	) as HTMLElement;
	const nextPlayerElement = document.getElementById(
		`player-${nextPlayerTurn + 1}`
	) as HTMLElement;

	toggleClasses(prevPlayerElement, ["active-player", "inactive-player"]);

	toggleClasses(nextPlayerElement, ["active-player", "inactive-player"]);
}

function increaseScore() {
	players[playerTurn].score++;
}

function placeCards(cards: Array<HTMLElement>): void {
	const cardElements = cards.map((card) => {
		const element = newElement("div", [
			"grid-cell",
			"bg-blue-400",
			"rounded-md",
			"shadow-md",
			"w-[100px]",
			"h-[100px]",
			"border",
			"border-slate-700",
		]);
		addChildren(element, [card]);
		return element;
	});

	addChildren(cardGrid, cardElements);
}

function useState<T>(startValue: T): [() => T, (val: T) => T] {
	let state = startValue;
	return [
		() => {
			return state;
		},
		(val) => {
			state = val;
			return state;
		},
	];
}

const [getMatchDict, setMatchDict] = useState({} as CardMatchDict);

function prepareDeck(deck) {
	const subset = deck; // use full deck for now; take subset later to accomodate larger decks.

	const newMatchDict = {};

	for (const card of subset) {
		const id = card.id;
		newMatchDict[id] = {
			matched: false,
			card: card,
		};
	}

	setMatchDict(newMatchDict);

	const cards: Cards = [...subset, ...subset];
	shuffle(cards);

	return cards;
}

function prepareBoard(cards) {
	const flipCards = cards.map((card, ind) => {
		const front = newElement("span");

		const back = newElement("img", [
			"w-full",
			"h-full",
			"object-cover",
			"rounded-md",
		]) as HTMLImageElement;

		back.src = card.image;
		back.title = card.name;

		const flipCard = FlipCard([front], [back]);
		flipCard.id = `${card.id}_${Math.floor(Math.random() * 100000)}`;
		flipCard.title = `Card ${ind + 1}`;

		return flipCard;
	});

	placeCards(flipCards);
	roundCounter();
}

function renderPlayers() {
	removeChildren(playerAreaLeft);
	removeChildren(playerAreaRight);

	const playerSpots = players.map((player) => {
		return PlayerSpot(player.order, player.name);
	});

	toggleClasses(playerSpots[0], ["active-player", "inactive-player"]);

	const leftPlayers: typeof playerSpots = [];
	const rightPlayers: typeof playerSpots = [];

	playerSpots.forEach((player, ind) => {
		if (ind % 2 == 0) {
			leftPlayers.push(player);
		} else {
			rightPlayers.push(player);
		}
	});

	addChildren(playerAreaLeft, leftPlayers);
	addChildren(playerAreaRight, rightPlayers);
}

function resetAfterMatch(cardId, cardMatchDict) {
	cardMatchDict[cardId].matched = true;
	increaseScore();
	renderScore();
	selectedCards = [];
}

function resetAfterNoMatch() {
	for (const element of selectedCards) {
		toggleClasses(element, ["flipped"]);
	}

	selectedCards = [];
	nextTurn();
}

function binaryIdMatch(ids: Array<string>) {
	return ids[0] == ids[1];
}

const cards = prepareDeck(animalDeck);
prepareBoard(cards);
renderPlayers();

let matchPredicate = binaryIdMatch;

let frozen: boolean = false;

///////////////////////
/// Event Listeners ///
///////////////////////

const resetButton = document.getElementById("reset-button") as HTMLElement;
resetButton.addEventListener("click", (event) => {
	roundsPlayed = 0;
	playerTurn = 0;

	renderPlayers();

	removeChildren(cardGrid);
	const cards = prepareDeck(animalDeck);
	prepareBoard(cards);
});

document.addEventListener("click", (event) => {
	if (frozen == true) {
		return;
	}

	const target = event.target as HTMLElement;

	if (target.matches(".flip-box *")) {
		const currentFlipCard = target.closest(".flip-box") as HTMLElement;

		const currentCardId = currentFlipCard.id.split("_")[0];

		const cardMatchDict = getMatchDict();
		const { matched } = cardMatchDict[currentCardId];

		const ongoingSelection = !matched && selectedCards.length < 2;

		if (!ongoingSelection) {
			return;
		}

		if (selectedCards.length > 0) {
			const alreadySelected = selectedCards.some((selectedCard) => {
				return selectedCard.id == currentFlipCard.id;
			});

			if (alreadySelected) return;
		}

		selectedCards.push(currentFlipCard);
		toggleClasses(currentFlipCard, ["flipped"]);

		if (selectedCards.length != sequenceLength) {
			return;
		}

		const cardIds = selectedCards.map((element) => {
			return element.id.split("_")[0];
		});

		const match = matchPredicate(cardIds);

		if (match) resetAfterMatch(currentCardId, cardMatchDict);
		else {
			frozen = true;

			setTimeout(() => {
				frozen = false;
				resetAfterNoMatch();
			}, 1500);
		}
	}
});
