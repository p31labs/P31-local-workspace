import { useState, useEffect } from 'react'
import './App.css'

// Task categories with default costs
const TASKS = [
  { id: 'green1', name: 'Routine Tasks', cost: 1, color: 'green' },
  { id: 'green2', name: 'Passive Screen Time', cost: 1, color: 'green' },
  { id: 'yellow1', name: 'Phone Calls', cost: 2, color: 'yellow' },
  { id: 'yellow2', name: 'Moderate Cognitive Work', cost: 3, color: 'yellow' },
  { id: 'yellow3', name: 'Appointments', cost: 2, color: 'yellow' },
  { id: 'red1', name: 'Medical Exams', cost: 4, color: 'red' },
  { id: 'red2', name: 'Unfamiliar Locations', cost: 5, color: 'red' },
  { id: 'red3', name: 'Confrontation', cost: 4, color: 'red' },
  { id: 'black1', name: 'Court Appearances', cost: 6, color: 'black' },
  { id: 'black2', name: 'Crisis Events', cost: 6, color: 'black' },
  { id: 'black3', name: 'System Failures', cost: 6, color: 'black' }
]

// Modifiers that can be applied to tasks
const MODIFIERS = [
  { id: 'driver', name: 'Someone Else Drives', value: -1, maxStack: 2 },
  { id: 'familiar', name: 'Familiar Environment', value: -1, maxStack: 1 },
  { id: 'planned', name: 'Prep/Planning Done', value: -1, maxStack: 1 },
  { id: 'unexpected', name: 'Unexpected Change', value: 1, maxStack: 1 },
  { id: 'overload', name: 'Sensory Overload', value: 1, maxStack: 1 },
  { id: 'pressure', name: 'Time Pressure', value: 1, maxStack: 1 }
]

function App() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('spoon-state')
    return saved ? JSON.parse(saved) : {
      baseCapacity: 12,
      sleepModifier: 0,
      calciumModifier: 0,
      residualModifier: 0,
      activeModifiers: {},
      history: [],
      taskCount: 0
    }
  })

  const [showModifiers, setShowModifiers] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [toolCheck, setToolCheck] = useState(false)

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('spoon-state', JSON.stringify(state))
  }, [state])

  // Calculate remaining spoons
  const calculateRemaining = () => {
    const baseModifiers = state.sleepModifier + state.calciumModifier + state.residualModifier
    const baseTotal = state.baseCapacity + baseModifiers
    
    let totalCost = 0
    state.history.forEach(entry => {
      const taskCost = entry.baseCost
      const modifierTotal = Object.values(entry.modifiers || {}).reduce((sum, val) => sum + val, 0)
      totalCost += taskCost + modifierTotal
    })
    
    return baseTotal - totalCost
  }

  // Calculate capacity percentage and zone
  const getCapacityInfo = () => {
    const baseModifiers = state.sleepModifier + state.calciumModifier + state.residualModifier
    const baseTotal = state.baseCapacity + baseModifiers
    const remaining = calculateRemaining()
    const pct = baseTotal > 0 ? remaining / baseTotal : 0
    
    let zone = 'green'
    if (pct <= 0) zone = 'black'
    else if (pct <= 0.25) zone = 'red'
    else if (pct <= 0.5) zone = 'yellow'
    
    return { remaining, baseTotal, pct, zone }
  }

  const capacityInfo = getCapacityInfo()

  // Handle task selection
  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setShowModifiers(true)
  }

  // Apply modifiers and log task
  const applyModifiers = (modifiers) => {
    const taskCost = selectedTask.cost
    const modifierTotal = Object.values(modifiers).reduce((sum, val) => sum + val, 0)
    const finalCost = Math.max(0, taskCost + modifierTotal)
    
    const newEntry = {
      id: Date.now(),
      task: selectedTask.name,
      baseCost: taskCost,
      modifiers: modifiers,
      finalCost: finalCost,
      timestamp: new Date().toLocaleTimeString()
    }
    
    setState(prev => ({
      ...prev,
      history: [...prev.history, newEntry],
      taskCount: prev.taskCount + 1
    }))
    
    setSelectedTask(null)
    setShowModifiers(false)
    
    // Tool check: warn if 3+ tasks without pause
    if (state.taskCount >= 2) {
      setToolCheck(true)
    }
  }

  // Reset daily state
  const resetDay = () => {
    setState(prev => ({
      ...prev,
      history: [],
      taskCount: 0,
      residualModifier: calculateRemaining() // Carry over remaining as residual
    }))
    setToolCheck(false)
  }

  // Export data
  const exportData = () => {
    const data = {
      date: new Date().toISOString().split('T')[0],
      settings: {
        baseCapacity: state.baseCapacity,
        sleepModifier: state.sleepModifier,
        calciumModifier: state.calciumModifier
      },
      history: state.history,
      summary: {
        totalUsed: state.history.reduce((sum, entry) => sum + entry.finalCost, 0),
        remaining: calculateRemaining(),
        capacityInfo
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spoon-calculator-${data.date}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Spoon Calculator</h1>
        <p className="subtitle">Personal energy management for P31 Andromeda</p>
        
        {/* Base Settings */}
        <div className="card" style={{ marginBottom: '15px' }}>
          <h3>Base Settings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div>
              <label>Base Capacity</label>
              <input 
                type="number" 
                value={state.baseCapacity} 
                onChange={(e) => setState(prev => ({ ...prev, baseCapacity: parseInt(e.target.value) || 12 }))}
                style={{ width: '100%', padding: '8px', background: '#334155', border: '1px solid #475569', color: 'white', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label>Sleep Quality (±2)</label>
              <select 
                value={state.sleepModifier} 
                onChange={(e) => setState(prev => ({ ...prev, sleepModifier: parseInt(e.target.value) }))}
                style={{ width: '100%', padding: '8px', background: '#334155', border: '1px solid #475569', color: 'white', borderRadius: '4px' }}
              >
                <option value="-2">Poor (-2)</option>
                <option value="-1">Fair (-1)</option>
                <option value="0">Good (0)</option>
                <option value="1">Great (+1)</option>
                <option value="2">Excellent (+2)</option>
              </select>
            </div>
            <div>
              <label>Calcium Status (±2)</label>
              <select 
                value={state.calciumModifier} 
                onChange={(e) => setState(prev => ({ ...prev, calciumModifier: parseInt(e.target.value) }))}
                style={{ width: '100%', padding: '8px', background: '#334155', border: '1px solid #475569', color: 'white', borderRadius: '4px' }}
              >
                <option value="-2">Deficient (-2)</option>
                <option value="-1">Low (-1)</option>
                <option value="0">Adequate (0)</option>
                <option value="1">Good (+1)</option>
                <option value="2">Optimal (+2)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Spoon Display */}
        <div className="card">
          <div className="spoon-display">
            <div>
              <div className={`spoon-count ${capacityInfo.zone}`}>
                {capacityInfo.remaining}
              </div>
              <div className="spoon-capacity">spoons remaining</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="spoon-capacity">of {capacityInfo.baseTotal} total</div>
              <div className="spoon-capacity">{Math.round(capacityInfo.pct * 100)}% capacity</div>
            </div>
          </div>
          
          {/* Tool Check */}
          {toolCheck && (
            <div className="tool-check">
              ⚠️ What tool are you holding? Take a pause between tasks.
            </div>
          )}
        </div>

        {/* Task Buttons */}
        <div className="card">
          <h3>Quick Task Logging</h3>
          <div className="controls-grid">
            {TASKS.map(task => (
              <button 
                key={task.id} 
                className={`button ${task.color}`}
                onClick={() => handleTaskClick(task)}
              >
                {task.name} ({task.cost})
              </button>
            ))}
          </div>
        </div>

        {/* Modifiers Modal */}
        {showModifiers && selectedTask && (
          <div className="card" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, width: '90%', maxWidth: '500px' }}>
            <h3>Modifiers for {selectedTask.name}</h3>
            <p>Base cost: {selectedTask.cost} spoons</p>
            
            <div className="modifiers">
              {MODIFIERS.map(mod => {
                const currentValue = state.activeModifiers[mod.id] || 0
                const canIncrease = currentValue < mod.maxStack
                const canDecrease = currentValue > -mod.maxStack
                
                return (
                  <div key={mod.id} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <button 
                      className="modifier-button"
                      disabled={!canDecrease}
                      onClick={() => {
                        setState(prev => ({
                          ...prev,
                          activeModifiers: {
                            ...prev.activeModifiers,
                            [mod.id]: Math.max(-mod.maxStack, currentValue - 1)
                          }
                        }))
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{mod.name}</span>
                    <button 
                      className="modifier-button"
                      disabled={!canIncrease}
                      onClick={() => {
                        setState(prev => ({
                          ...prev,
                          activeModifiers: {
                            ...prev.activeModifiers,
                            [mod.id]: Math.min(mod.maxStack, currentValue + 1)
                          }
                        }))
                      }}
                    >
                      +
                    </button>
                    <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                      {currentValue > 0 ? `+${currentValue}` : currentValue}
                    </span>
                  </div>
                )
              })}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                className="button green"
                onClick={() => applyModifiers(state.activeModifiers)}
              >
                Log Task
              </button>
              <button 
                className="button"
                onClick={() => {
                  setShowModifiers(false)
                  setSelectedTask(null)
                  setState(prev => ({ ...prev, activeModifiers: {} }))
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* History */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3>Today's Activity</h3>
            <div className="export-controls">
              <button className="button" onClick={resetDay}>Reset Day</button>
              <button className="button" onClick={exportData}>Export Data</button>
            </div>
          </div>
          
          {state.history.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No activities logged yet today.</p>
          ) : (
            <div>
              {state.history.slice().reverse().map(entry => (
                <div key={entry.id} className="history-item">
                  <div>
                    <strong>{entry.task}</strong>
                    <span style={{ color: 'var(--muted)', marginLeft: '10px' }}>
                      {Object.entries(entry.modifiers).map(([key, value]) => 
                        value !== 0 ? `${key}: ${value > 0 ? '+' : ''}${value}` : null
                      ).filter(Boolean).join(', ')}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold' }}>{entry.finalCost} spoons</div>
                    <div className="history-time">{entry.timestamp}</div>
                  </div>
                </div>
              ))}
              
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <strong>Total Used:</strong>
                <strong>{state.history.reduce((sum, entry) => sum + entry.finalCost, 0)} spoons</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App