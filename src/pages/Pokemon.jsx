import { React, useState, useRef, useEffect } from 'react';
import pokemonData from '../data/pokemonData';
import { Button, Card, Alert, Checkbox } from 'antd';

function Pokemon() {
  const [playerPokemon, setPlayerPokemon] = useState(null);
  const [opponentPokemon, setOpponentPokemon] = useState(null);
  const [message, setMessage] = useState("");
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [attacklogs, setAttacklogs] = useState([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const attackSound = useRef(null);
  const missedSound = useRef(null);
  const [playerTeam, setPlayerTeam] = useState([]);
  const [opponentTeam, setOpponentTeam] = useState([]);
  const [currentPlayerPokemon, setCurrentPlayerPokemon] = useState(null);
  const [currentOpponentPokemon, setCurrentOpponentPokemon] = useState(null);
  const [checkedPokemons, setCheckedPokemons] = useState({});

  // Function to select Pokemon
  // const choosePokemon = (pokemon) => {
  //   setPlayerPokemon({ ...pokemon, attacks: [...pokemon.attacks] });

  //   const randomOpponent = pokemonData[Math.floor(Math.random() * pokemonData.length)];

  //   setOpponentPokemon({
  //     ...randomOpponent, attacks: [...randomOpponent.attacks]
  //   });

  //   setMessage(`You chose ${pokemon.name}! Opponent sent out ${randomOpponent.name}!`);

  //   setIsPlayerTurn(true);

  //   setAttacklogs([]);
  // };

  const selectTeam = (selectedPokemon, e) => {
    if (playerTeam.length < 3 && !playerTeam.includes(selectedPokemon)) {
      setPlayerTeam([...playerTeam, selectedPokemon]);
      setCheckedPokemons((prevCheckedPokemons) => ({ ...prevCheckedPokemons, [selectedPokemon.name]: true }));
    }
  };

  const startBattle = () => {
    if (playerTeam.length === 3 && opponentTeam.length === 3) {
      setCurrentPlayerPokemon(playerTeam[0]);
      setCurrentOpponentPokemon(opponentTeam[0]);
      setMessage(`You sent out ${playerTeam[0].name}! Opponent sent out ${opponentTeam[0].name}!`);
    } else {
      setMessage("Both teams must have 3 Pokemons to start the battle.");
    }
  };


  const switchPlayerPokemon = () => {
    const nextPlayer = playerTeam.find(pokemon => pokemon.hp > 0 && pokemon !== currentPlayerPokemon);
    if (nextPlayer) {
      setCurrentPlayerPokemon(nextPlayer);
      setMessage(`Player switched to ${nextPlayer.name}!`);
      setIsPlayerTurn(false);
      setTimeout(() => {
        opponentAttack();
      }, 1000);
    }
  };

  const switchOpponentPokemon = () => {
    const nextOpponent = opponentTeam.find(pokemon => pokemon.hp > 0 && pokemon !== currentOpponentPokemon);
    if (nextOpponent) {
      setCurrentOpponentPokemon(nextOpponent);
      setMessage(`Opponent switched to ${nextOpponent.name}!`);
    }
  };

  const resetGame = () => {
    setPlayerTeam([]);
    setOpponentTeam([]);
    setCurrentPlayerPokemon(null);
    setCurrentOpponentPokemon(null);
    setMessage("");
    setIsPlayerTurn(true);
    setAttacklogs([]);
    window.location.reload();
  };

  const renderLifeBar = (hp, maxHp) => {
    const widthPercentage = (hp / maxHp) * 100;
    const percentagerounded = Number(widthPercentage.toFixed(0));
    return (
      <div className='h-6 bg-gray-300 rounded-full overflow-hidden relative'>
        <div className="h-full bg-green-500 absolute" style={{ width: `${widthPercentage}%` }} />
        <div className="h-full flex items-center justify-center relative z-10 font-semibold">
          HP: {hp}/{maxHp}
        </div>
      </div>
    );
  };

  const addLog = (log) => {
    console.log(log);
    setAttacklogs(prevLogs => [log, ...prevLogs]);
  };

  const playerAttack = (selectedAttack) => {
    if (isAttacking) return;

    setIsAttacking(true);

    if (!currentPlayerPokemon || !currentOpponentPokemon) {
      setMessage("Choose your Pokemon to start battle");
      return;
    };

    if (selectedAttack.uses <= 0) {
      const log = `${currentPlayerPokemon.name} has no uses for ${selectedAttack.name} left!`;
      setMessage(log);
      addLog(log);
      return;
    }

    if (Math.random() > selectedAttack.accuracy) {
      const log = `${currentPlayerPokemon.name} tried to use ${selectedAttack.name} but missed!`;
      missedSound.current.play();
      setMessage(log);
      addLog(log);

      setTimeout(() => {
        setIsPlayerTurn(false);
        opponentAttack();
        setIsAttacking(false);
      }, 1000);
      return;
    }

    if (attackSound.current) {
      attackSound.current.play();
    }

    const playerDamage = selectedAttack.damage;
    const opponentHp = currentOpponentPokemon.hp - playerDamage >= 0 ? currentOpponentPokemon.hp - playerDamage : 0;

    setCurrentOpponentPokemon({ ...currentOpponentPokemon, hp: opponentHp });

    selectedAttack.uses -= 1;

    let commentary = "";
    if (playerDamage > 10) {
      commentary = "It's super Effective";
    }
    if ((selectedAttack?.name === "Confusion") && (Math.random() < 0.5)) {
      commentary += `The opponent ${currentOpponentPokemon.name} is confused!`;
    }

    const log = `You used ${selectedAttack.name} for ${playerDamage} damage! ${commentary}`;
    setMessage(log);
    addLog(log);

    if (opponentHp <= 0) {
      setCurrentOpponentPokemon({ ...currentOpponentPokemon, hp: 0 });
      const nextOpponent = opponentTeam.find(pokemon => pokemon.hp > 0);
      if (nextOpponent) {
        switchOpponentPokemon();
      } else {
        setMessage(`You win! Your team wins!`);
        setIsPlayerTurn(false);
        setIsAttacking(false);
      }
    }

    setTimeout(() => {
      setIsPlayerTurn(false);
      opponentAttack();
      setIsAttacking(false);
    }, 1000);
  };

  const opponentAttack = () => {
    if (!currentPlayerPokemon || !currentOpponentPokemon) {
      setMessage("Choose your Pokemon to start battle");
      return;
    }

    const availableAttacks = currentOpponentPokemon.attacks.filter((attack) => attack.uses > 0);

    if (availableAttacks.length === 0) {
      const log = `${currentOpponentPokemon.name} has no attacks left!`;
      setMessage(log);
      addLog(log);
      return;
    }

    // const playerAvailableAttacks = currentPlayerPokemon.attacks.filter((attack) => attack.uses > 0);
    // const totalPlayerAttackUses = playerAvailableAttacks.reduce((total, attack) => total + attack.uses, 0);

    // if (totalPlayerAttackUses === 0) {
    //   const log = "Your pokemon has no more attacks left! You Lose!";
    //   setMessage(log);
    //   addLog(log);
    //   return;
    // }

    const selectedAttack = availableAttacks[Math.floor(Math.random() * availableAttacks.length)];

    if (selectedAttack.uses <= 0) {
      setMessage(`No more uses left for ${selectedAttack.name}`);
      return;
    }

    if (Math.random() > selectedAttack.accuracy) {
      const log = `${currentOpponentPokemon.name} tried to use ${selectedAttack.name} but missed!`;
      missedSound.current.play();
      setMessage(log);
      addLog(log);

      setTimeout(() => {
        setIsPlayerTurn(true);
      }, 1000);
      return;
    }

    if (attackSound.current) {
      attackSound.current.play();
    }

    const opponentDamage = selectedAttack.damage;
    const playerHp = currentPlayerPokemon.hp - opponentDamage >= 0 ? currentPlayerPokemon.hp - opponentDamage : 0;

    setCurrentPlayerPokemon({ ...currentPlayerPokemon, hp: playerHp });

    selectedAttack.uses -= 1;

    let commentary = "";
    if (opponentDamage > 10) {
      commentary = "It's super Effective";
    }
    if ((selectedAttack?.name === "Confusion") && (Math.random() < 0.5)) {
      commentary += `Your ${currentPlayerPokemon.name} is confused!`;
    }

    const log = `${currentOpponentPokemon.name} used ${selectedAttack.name} for ${opponentDamage} damage! ${commentary}`;
    setMessage(log);
    addLog(log);

    if (playerHp <= 0) {
      setCurrentPlayerPokemon({ ...currentPlayerPokemon, hp: 0 });
      const nextPlayer = playerTeam.find(pokemon => pokemon.hp > 0);
      if (nextPlayer) {
        switchPlayerPokemon(nextPlayer);
      } else {
        setMessage(`You lose! Opponent's team wins!`);
        setIsPlayerTurn(false);
      }
    }

    const playerAvailableAttacks = currentPlayerPokemon.attacks.filter((attack) => attack.uses > 0);
    const totalPlayerAttackUses = playerAvailableAttacks.reduce((total, attack) => total + attack.uses, 0);
    
    if (totalPlayerAttackUses === 0) {
      const log = `${currentPlayerPokemon.name} has no more attacks left! Switching to next Pokemon...`;
      setMessage(log);
      addLog(log);
    
      // Check if playerTeam is correctly structured and accessible
      const nextPlayer = playerTeam.find(pokemon => 
        pokemon.attacks.some(attack => attack.uses > 0)
      );
      
      if (nextPlayer) {
        switchPlayerPokemon(nextPlayer);

        const newAvailablePlayerAttacks = nextPlayer.attacks.filter((attack) => attack.uses >0 );
        const newTotalPlayerAttackUses = newAvailablePlayerAttacks.reduce((total, attack) => total + attack.uses, 0);
        console.log(`Switched to ${nextPlayer.name} with ${newTotalPlayerAttackUses} total attack uses left.`);
      } else {
        setMessage(`No available Pokemon with remaining attacks. You lose!`);
      }
      return;
    };

    setTimeout(() => {
      setIsPlayerTurn(true);
    }, 1000);
  };

  const toggleDisable = () => {
    setPlayerTeam([]);
    setCheckedPokemons({});
  };

  useEffect(() => {
    if (playerTeam.length === 3) {
      const randomOpponentTeam = [];
      while (randomOpponentTeam.length < 3) {
        const randomPokemon = pokemonData[Math.floor(Math.random() * pokemonData.length)];
        if (!randomOpponentTeam.includes(randomPokemon)) {
          randomOpponentTeam.push(randomPokemon);
        }
      }
      setOpponentTeam(randomOpponentTeam);
    }
  }, [playerTeam]);

  return (
    <div className='bg-gray-100 min-h-screen min-w-screen p-0 md:p-8'>
      <div className="w-full min-h-[800px] bg-gray-100">
        <h1 className='text-3xl font-bold mb-4'>Pokemon Battle Game</h1>

        {currentPlayerPokemon?.hp != null && currentOpponentPokemon != null && (
          <div>
            <Alert message={message || "Choose your Pokemon!"} className='font-semibold mb-4 max-w-lg mx-auto' />
            <Button variant="solid" color="danger" onClick={resetGame}>
              Reset Game
            </Button>
          </div>
        )}

        {currentPlayerPokemon?.hp == null && currentOpponentPokemon?.hp == null && (
          <div className="flex flex-wrap gap-4 justify-center">
            <div className='flex flex-col'>
              
              <h2 className='font-bold text-2xl text-center mx-auto'>Choose your Pokemon</h2>

              <div className='mt-4 flex justify-center gap-x-4'>
                <Button variant="solid" color="danger"  onClick={toggleDisable}>
                  Reset Selection
                </Button>

                <Button variant="solid" color="primary" onClick={startBattle} disabled={playerTeam.length < 3 || opponentTeam.length < 3}>
                  Start Battle
                </Button>
              </div>


            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {pokemonData.map((pokemon) => (
                <Card title={pokemon.name} className='w-[200px] shadow-md' key={pokemon.name}>
                  <div className='flex items-center flex-col'>
                    <img
                      src={pokemon.sprite}
                      alt={pokemon.name}
                      className='w-40 h-40 flex justify-center items-center mt-[-2rem]'
                    />
                    <div className='bg-yellow-400 p-0.5 pl-2 rounded-xl'>
                      <Checkbox
                        checked={checkedPokemons[pokemon.name]}
                        key={pokemon.name}
                        onChange={() => selectTeam(pokemon)}
                        className='font-semibold mt-[-1rem]'
                        disabled={playerTeam.length >= 3}
                      >
                        Select
                      </Checkbox>
                    </div> 
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentPlayerPokemon?.hp != null && currentOpponentPokemon?.hp != null && (
          <div className="flex flex-col gap-4 max-w-[1000px] mx-auto">
            <div className="flex justify-center items-center gap-x-8">
              <div className="flex-1 text-center max-w-lg">
                <h3>{currentPlayerPokemon?.name}</h3>
                <div className='flex justify-center'>
                  <img
                    src={currentPlayerPokemon?.sprite}
                    alt={currentPlayerPokemon?.name}
                    className={currentPlayerPokemon?.isAttacking ? "attacking" : ""}
                  />
                </div>
                {renderLifeBar(currentPlayerPokemon?.hp, currentPlayerPokemon?.maxHp)}
              </div>

              <div className="flex-1 text-center max-w-lg">
                <h3>{currentOpponentPokemon?.name}</h3>
                <div className='flex justify-center'>
                  <img
                    src={currentOpponentPokemon?.sprite}
                    alt={currentOpponentPokemon?.name}
                    className={currentOpponentPokemon?.isAttacking ? "attacking" : ""}
                  />
                </div>
                {renderLifeBar(currentOpponentPokemon?.hp, currentOpponentPokemon?.maxHp)}
              </div>
            </div>

            {currentPlayerPokemon?.hp > 0 && currentOpponentPokemon?.hp > 0 && (
              <div className="attack-options flex justify-center gap-2">
                {currentPlayerPokemon?.attacks.map((selectedAttack) => (
                  <Button
                    key={selectedAttack?.name}
                    onClick={() => playerAttack(selectedAttack)}
                    disabled={selectedAttack.uses <= 0 || isAttacking}
                    variant='solid'
                    color='blue'
                    className='text-white'
                  >
                    {selectedAttack.name} ({selectedAttack.damage} dmg)
                  </Button>
                ))}
              </div>
            )}

            <div className="flex justify-center gap-6">
              <div className='w-40 flex flex-col'> 
                <h3 className='font-semibold text-sm'>Your Team</h3>
                {playerTeam.map(pokemon => (
                  <div key={pokemon.name}>
                    <img
                      src={pokemon.sprite}
                      alt={pokemon.name}
                      className='w-20 h-20 mx-auto'
                    />
                    {renderLifeBar(pokemon.hp, pokemon.maxHp)}
                  </div>
                ))}
              </div>
              <div className="w-full">
                <h1 className="text-xl font-bold mb-2">Battle Log</h1>
                <div className="bg-white min-w-full mx-auto min-h-[400px] max-h-[400px] p-2 rounded-xl shadow-md overflow-y-auto">
                  {attacklogs.map((log, index) => (
                    <div key={index} className="py-1">{log}</div>
                  ))}
                </div>
              </div>
              <div className='w-40'>
                <h3 className='font-semibold text-sm'>Opponent Team</h3>
                {opponentTeam.map(pokemon => (
                  <div key={pokemon.name}>
                    <img
                      src={pokemon.sprite}
                      alt={pokemon.name}
                      className='w-20 h-20 mx-auto'
                    />
                    {renderLifeBar(pokemon.hp, pokemon.maxHp)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <audio
          ref={attackSound}
          src="https://vgmtreasurechest.com/soundtracks/pokemon-sfx-gen-3-attack-moves-rse-fr-lg/izqqhmeayp/Tackle.mp3"
          preload="auto"
        />

        <audio
          ref={missedSound}
          src={"https://codeskulptor-demos.commondatastorage.googleapis.com/pang/arrow.mp3"}
          preload="auto"
        />

      </div>
    </div>
  );
}

export default Pokemon;