module.exports = function(audioContext){
  var node = Object.create(proto)
  node._targets = []
  node.context = audioContext
  return node
}

var proto = {

  attack: 0,
  decay: 0,
  sustain: 1,
  release: 0,
  startValue: 0,
  endValue: 0,

  sustainFrom: null,

  start: function(at){
    var decayFrom = this._decayFrom = at+this.attack

    var targets = this._targets
    for (var i=0;i<targets.length;i++){
      var target = targets[i]
      var value = target.value
      var sustain = value * this.sustain

      if (this.attack){
        target.setValueAtTime(this.startValue, at)
        var curve = getAttackCurve(this.startValue, this.attack, value, this.context.sampleRate)
        target.setValueCurveAtTime(curve, at, curve.length / this.context.sampleRate)
      }

      if (this.decay){
        target.setTargetAtTime(sustain, decayFrom, getTimeConstant(this.decay))
      }
    }
  },
  stop: function(at, isTarget){
    if (isTarget){
      at = at - this.release
    }
    var endTime = at + this.release
    if (this.release){
      var targets = this._targets
      for (var i=0;i<targets.length;i++){
        var target = targets[i]
        target.cancelScheduledValues(at)
        target.setTargetAtTime(this.endValue, at, getTimeConstant(this.release))
      }
    }
    return endTime
  },
  connect: function(param){
    if (!~this._targets.indexOf(param)){
      this._targets.push(param)
    }
  },
  disconnect: function(){
    this._targets.length = 0
  },
  destroy: function(){
    this.disconnect()
  }
}

function getTimeConstant(time){
  return Math.log(time+1)/Math.log(100)
}

function getAttackCurve(from, attack, value, sampleRate){
  var length = attack * sampleRate

  var attackStep = attack ? (value - from) / (attack * sampleRate) : 0
  //var decayStep = decay ? (sustain - value) / (decay * sampleRate) : 0

  var attackSteps = attack * sampleRate

  if (length){
    var result = new Float32Array(length)
    for (var i=0;i<length;i++){
      result[i] = i * attackStep
    }
    return result
  }
}