// Pedagogical NSW Primary Math Word Problem Generator (Offline Fallback & Model Templates)

const NAMES = ['Liam', 'Aarav', 'Soraya', 'Chloe', 'Ahmad', 'Priya', 'Jack', 'Zainab', 'Ethan', 'Maya', 'Rohan', 'Bilal'];

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function generateFallbackProblem(stage = 'Stage 1', contentArea = 'Addition', equation = '', includeExtension = false) {
    const n1 = pick(NAMES);
    let n2 = pick(NAMES);
    while (n2 === n1) n2 = pick(NAMES);

    let problem = '';
    const cleanEq = equation.trim();

    // Check if equation is simple binary e.g. "50+18", "12 - 4", "6 * 3", "20 / 4"
    const match = cleanEq.match(/^(\d+(?:\.\d+)?)\s*([\+\-\*\/xX÷])\s*(\d+(?:\.\d+)?)$/);

    if (match) {
        const num1 = parseFloat(match[1]);
        const op = match[2];
        const num2 = parseFloat(match[3]);

        if (op === '+' || contentArea === 'Addition') {
            problem = `${n1} collected ${num1} stickers on Monday. On Tuesday, ${n2} gave them ${num2} more stickers. How many stickers does ${n1} have altogether?`;
        } else if (op === '-' || contentArea === 'Subtraction') {
            const big = Math.max(num1, num2);
            const small = Math.min(num1, num2);
            problem = `${n1} had ${big} trading cards in a binder. They gave ${small} cards to ${n2} during lunch. How many cards does ${n1} have left?`;
        } else if (op === '*' || op.toLowerCase() === 'x' || contentArea === 'Multiplication') {
            problem = `There are ${num1} tables in the classroom. ${n1} placed ${num2} counters on each table. How many counters are there in total?`;
        } else if (op === '/' || op === '÷' || contentArea === 'Division') {
            problem = `${n1} shared ${num1} pencils equally among ${num2} friends. How many pencils did each friend receive?`;
        }
    }

    if (!problem) {
        // Stage-appropriate procedural fallbacks
        const isES1 = stage.includes('Early') || stage === 'ES1';
        const isS1 = stage.includes('Stage 1') && !stage.includes('Early');
        const isS2 = stage.includes('Stage 2');
        const isS3 = stage.includes('Stage 3');

        switch (contentArea) {
            case 'Addition':
                if (isES1) {
                    problem = `${n1} has 4 red blocks. ${n2} brings 3 blue blocks. How many blocks do they have in all?`;
                } else if (isS1) {
                    problem = `${n1} scored 14 points in a basketball game. ${n2} scored 23 points. How many points did they score together?`;
                } else if (isS2) {
                    problem = `${n1} read 145 pages of a book last week. ${n2} read 238 pages. How many pages did they read altogether?`;
                } else {
                    problem = `${n1} collected $42.50 for the school fundraiser. ${n2} collected $38.75. How much money did they raise in total?`;
                }
                break;

            case 'Subtraction':
                if (isES1) {
                    problem = `${n1} had 7 toy cars. 2 drove away into the garage. How many cars are left?`;
                } else if (isS1) {
                    problem = `${n1} had 36 coloured pencils. They gave 14 to ${n2} to share. How many pencils does ${n1} still have?`;
                } else if (isS2) {
                    problem = `The school canteen started the day with 250 juice boxes. By the end of lunch, 184 had been sold. How many juice boxes remain?`;
                } else {
                    problem = `A sports club had a budget of $850. After buying new soccer equipment for $565, how much budget is left?`;
                }
                break;

            case 'Multiplication':
                if (isES1) {
                    problem = `${n1} has 3 plates. There are 2 apples on each plate. How many apples are there altogether?`;
                } else if (isS1) {
                    problem = `${n1} planted 4 rows of seedlings with 5 plants in each row. How many seedlings are planted in total?`;
                } else if (isS2) {
                    problem = `${n1} bought 6 packs of sports cards. Each pack contains 12 cards. How many cards did ${n1} buy?`;
                } else {
                    problem = `A school bus travels 48 kilometres each day on its morning run. How many kilometres does it travel in 15 school days?`;
                }
                break;

            case 'Division':
                if (isES1) {
                    problem = `${n1} has 6 strawberries and shares them equally with ${n2}. How many strawberries does each person get?`;
                } else if (isS1) {
                    problem = `${n1} has 20 marbles and puts them into equal groups of 4. How many groups can they make?`;
                } else if (isS2) {
                    problem = `${n1} has 72 stickers to divide equally among 6 friends. How many stickers does each friend receive?`;
                } else {
                    problem = `A shipment of 348 library books needs to be packed evenly into 12 storage boxes. How many books go into each box?`;
                }
                break;

            case 'Fractions':
                if (isES1 || isS1) {
                    problem = `${n1} baked a round pizza and cut it into 4 equal slices. ${n2} ate 1 slice. What fraction of the pizza did ${n2} eat?`;
                } else if (isS2) {
                    problem = `In a class of 24 students, 1/3 walk to school and 1/2 catch the bus. How many students walk to school?`;
                } else {
                    problem = `${n1} ran 3/4 of a kilometre before resting. ${n2} ran 2/3 of a kilometre. Who ran further, and by how much?`;
                }
                break;

            case 'Chance':
                if (isES1 || isS1) {
                    problem = `${n1} has a bag with 8 blue marbles and 1 red marble. Is it likely, unlikely, or impossible that ${n1} will pull out a blue marble without looking? Why?`;
                } else if (isS2) {
                    problem = `${n1} rolls a standard 6-sided dice. What is the chance of rolling an even number? Explain whether rolling a 5 is equally likely as rolling a 2.`;
                } else {
                    problem = `A spinner is divided into 8 equal sections: 4 green, 3 yellow, and 1 red. What is the probability of spinning yellow? Write your answer as a fraction and a percentage.`;
                }
                break;

            case 'Data':
                if (isES1 || isS1) {
                    problem = `${n1} surveyed friends about their favourite fruit. 5 chose bananas, 8 chose apples, and 3 chose oranges. Which fruit was the most popular? How many friends were surveyed altogether?`;
                } else if (isS2) {
                    problem = `${n1} recorded daily lunch orders: Monday (42), Tuesday (38), Wednesday (55), Thursday (40), Friday (65). On which day were the most lunches ordered? What was the difference between Friday and Tuesday?`;
                } else {
                    problem = `In a school reading challenge, four classes read 120, 145, 110, and 165 books. What is the average (mean) number of books read per class?`;
                }
                break;

            default:
                problem = `${n1} has 12 counters. ${n2} gives them 8 more. How many counters are there in total?`;
        }
    }

    if (includeExtension) {
        const ext = [
            `Extension: Can you find more than one way to solve this? Show your thinking using numbers, words, or a diagram.`,
            `Extension: If the numbers were doubled, how would that change your solution? Explain your strategy.`,
            `Extension: Write your own similar problem where the answer is twice as big, and challenge a partner to solve it.`
        ];
        problem += `\n\n${pick(ext)}`;
    }

    return problem;
}
