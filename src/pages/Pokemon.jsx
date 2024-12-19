import { React, useState, useRef, useEffect } from 'react';
import pokemonData from '../data/pokemonData';
import { Button, Card, Alert, Checkbox } from 'antd';

function Pokemon() {
  const [playerTeam, setPlayerTeam] = useState([])
  const [opponentTeam, setOpponentTeam] = useState([])
  const [currentPlayerPokemon, setCurrentPlayerPokemon] = useState(null);
  const [currentOpponentPokemon, setCurrentOpponentPokemon] = useState(null);
  const [message, setMessage] = useState("");
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [attacklogs, setAttacklogs] = useState([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const attackSound = useRef(null);
  const missedSound = useRef(null);

  // Function to select Pokemon
  const choosePokemon = (selectedPokemon) => {
    if (playerTeam.length < 3 && !playerTeam.includes(selectedPokemon)) {
      setPlayerTeam([...playerTeam, {...selectedPokemon, hp: selectedPokemon.maxHp}]);
    }
  };

  const startBattle = () => {
    if (playerTeam.length < 3) {
      setMessage("You need to select 3 Pokemons to start a battle!")
      return;
    }
  
    const selectedOpponentTeam = [];
  
    while (selectedOpponentTeam.length < 3) {
      const randomOpponent = pokemonData[Math.floor(Math.random() * pokemonData.length)];
      if (!selectedOpponentTeam.find(p => p.name === randomOpponent.name) && !playerTeam.find(p => p.name === randomOpponent.name)){
        selectedOpponentTeam.push({...randomOpponent, hp: randomOpponent.maxHp});
      }
    }
  
    setOpponentTeam(selectedOpponentTeam);
    setCurrentPlayerPokemon({...playerTeam[0], attacks: [...playerTeam[0].attacks]});
    setCurrentOpponentPokemon({...selectedOpponentTeam[0], attacks: [...selectedOpponentTeam[0].attacks]});
    setMessage(`You chose ${playerTeam[0].name}! While opponent sent out ${selectedOpponentTeam[0].name}!`);
    setIsPlayerTurn(true);
    setAttacklogs([]);
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
    const getColor = (percentage) => {
      if (percentage < 30) return 'bg-red-500';
      if (percentage < 50) return 'bg-yellow-400';
      return 'bg-green-500';
    }
    return (
      <div className='h-6 bg-gray-300 rounded-full overflow-hidden relative'>
        <div className={`h-full ${getColor(widthPercentage)} absolute`} style={{ width: `${widthPercentage}%` }} />
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

  const handleRetreat = () => {
    const nextPlayerIndex = playerTeam.findIndex(pokemon => pokemon.name === currentPlayerPokemon.name) + 1;
    if (nextPlayerIndex < playerTeam.length) {
      const nextActivePokemon = playerTeam.slice(nextPlayerIndex).find(pokemon => pokemon.hp > 0);
      if (nextActivePokemon) {
        setCurrentPlayerPokemon({...nextActivePokemon, attacks: [...nextActivePokemon.attacks]});
        setMessage(`You ${currentPlayerPokemon.name} retreated! You sent out ${nextActivePokemon.name}`)
      } else {
        setMessage(`You can't retreat! No other Pokemon are available! You lose`);
        setIsPlayerTurn(false);
      }

    } else {
      setMessage(`You can't retreat! No other Pokemon are available! You lose`);
      setIsPlayerTurn(false);
    }
  };

  const playerAttack = (selectedAttack) => {
    if (isAttacking) return;
    setIsAttacking(true);

    if (!currentPlayerPokemon || !currentOpponentPokemon) {
      setMessage("Choose your Pokemons to start the battle!");
      return;
    }

    const opponentAvailableAttacks = currentOpponentPokemon.attacks.filter((attack) => attack.uses > 0);
    const totalOpponentAttackUses = opponentAvailableAttacks.reduce((total, attack) => total + attack.uses, 0);

    if (totalOpponentAttackUses === 0) {
      const log = `${currentOpponentPokemon.name} has no more attacks left! You Win!`;
      setMessage(log);
      addLog(log);
      return;
    }

    if (selectedAttack.uses <= 0) {
      const log = `${currentPlayerPokemon.name} has no uses for ${selectedAttack.name} left!`;
      setMessage(log);
      addLog(log);
      return;
    }

    if (Math.random() > selectedAttack.accuracy) {
      const log = `${currentOpponentPokemon} tried to use ${selectedAttack.name} but missed!`;
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
    const opponentHp = currentOpponentPokemon.hp - playerDamage >=0 ? currentOpponentPokemon.hp - playerDamage : 0;
    const newOpponentHp = Math.max(0, currentOpponentPokemon.hp - playerDamage);

    setCurrentOpponentPokemon(prev => ({...prev, hp: newOpponentHp}));
    setOpponentTeam(prev => prev.map(pokemon => pokemon.name === currentOpponentPokemon.name ? {...pokemon, hp: newOpponentHp} : pokemon));

    selectedAttack.uses = 1;

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
      const nextOpponentIndex = opponentTeam.findIndex(pokemon => pokemon.name === currentOpponentPokemon.name) + 1;
      if (nextOpponentIndex < opponentTeam.length) {
          setCurrentOpponentPokemon({ ...opponentTeam[nextOpponentIndex], attacks: [...opponentTeam[nextOpponentIndex].attacks] });
          setMessage(`Opponent's ${currentOpponentPokemon.name} fainted! Opponent sent out ${opponentTeam[nextOpponentIndex].name}!`);
      } else {
          setMessage(`You win! All opponent's Pokemon fainted!`);
          setIsPlayerTurn(false);
          setIsAttacking(false);
          return;
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

    const playerAvailableAttacks = currentPlayerPokemon.attacks.filter((attack) => attack.uses > 0);
    const totalPlayerAttackUses = playerAvailableAttacks.reduce((total, attack) => total + attack.uses, 0);

    if (totalPlayerAttackUses === 0) {
      const log = "Your pokemon has no more attacks left! You Lose!";
      setMessage(log);
      addLog(log);
      return;
    }

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
    const newPlayerHp = Math.max(0, currentPlayerPokemon.hp - opponentDamage);

    // setCurrentPlayerPokemon({ ...currentPlayerPokemon, hp: playerHp });

    setCurrentPlayerPokemon(prev => ({...prev, hp: newPlayerHp}));
    setPlayerTeam(prev => prev.map(pokemon => pokemon.name === currentPlayerPokemon.name ? {...pokemon, hp: newPlayerHp} : pokemon));

    selectedAttack.uses = 1;

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
      const nextPlayerIndex = playerTeam.findIndex(pokemon => pokemon.name === currentPlayerPokemon.name) + 1;
      if (nextPlayerIndex < playerTeam.length) {
        setCurrentPlayerPokemon({ ...playerTeam[nextPlayerIndex], attacks: [...playerTeam[nextPlayerIndex].attacks] });
        setMessage(`Your ${currentPlayerPokemon.name} fainted! You sent out ${playerTeam[nextPlayerIndex].name}!`);
      } else {
        setMessage(`You lose! All your Pokemon fainted!`);
        setIsPlayerTurn(false);
        return;
      }
    }

    setTimeout(() => {
      setIsPlayerTurn(true);
    }, 1000);
  };

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
              
              <h2 className='font-bold text-2xl text-center mx-auto'>Select {playerTeam.length}/3 Pokemons</h2>

              <div className='mt-4 flex justify-center gap-x-4'>
                <Button variant="solid" color="danger"  onClick={() => setPlayerTeam([])}>
                  Reset Selection
                </Button>

                <Button variant="solid" color="primary" onClick={startBattle} disabled={playerTeam.length < 3}>
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
                        key={pokemon.name}
                        onChange={(e) => {
                          if (e.target.checked) {
                            choosePokemon(pokemon);
                          } else {
                            setPlayerTeam(playerTeam.filter((p) => p.name !== pokemon.name));
                          }
                        }}
                        checked={playerTeam.some((p) => p.name === pokemon.name)}
                        disabled={playerTeam.length >= 3 && !playerTeam.includes(pokemon)}
                        className='font-semibold mt-[-1rem]'
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
                <Button variant='solid' color='danger' onClick={handleRetreat}>
                  Retreat
                </Button>
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