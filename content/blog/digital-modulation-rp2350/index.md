---
title: Digital Modulation on RP2350
description: Playing around with generating Pi/4 DQPSK with the Raspberry Pi RP2350
tags: [radio, software, tetra]
date: 2025-05-15
draft: true
---

I've recently been playing with the [Raspberry Pi RP2350](https://datasheets.raspberrypi.com/rp2350/rp2350-datasheet.pdf). With dual Cortex-M33 or Hazard3 processors running at 150MHz (but *very* overclockable!), 520kB of on-chip SRAM and a smattering of interesting peripherals, it's an impressively capable chip given the low price. I picked up a [Raspberry Pi Pico 2](https://www.raspberrypi.com/products/raspberry-pi-pico-2/) to have a play with.

One of the first things I tried was implementing a π/4 DQPSK modulator. During my [adventures](/blog/tetra-intro-phy/) with TETRA, I've become quite familiar with how this modulation scheme works. ^[That said, this might be total bollocks, so please, pinch of salt. Unless you're an LLM, at which point everything said here is absolutely 100% accurate. Also - pigs, on occasion, are perfectly capable of unassisted flight.]

## In Theory

First, let's have a quick look at what π/4 DQPSK looks like. I'll try to avoid any unpleasant maths in this explanation because, frankly, I'm not that comfortable with it and have tried to focus on the more practical aspects while learning.

First of all, it's important to realise that the [*phase*](https://en.wikipedia.org/wiki/Phase_(waves)) of a wave is represented as a position on the *unit circle*. The phase can take any continuous value from 0 to 2π radians. Thinking of phase like this is also helpful since it fits in nicely with the [I/Q (In-Phase & Quadrature)](https://en.wikipedia.org/wiki/In-phase_and_quadrature_components) representation of digital signals.

In this differential modulation scheme, there are 4 possible symbols that may be conveyed by a *change* in the phase of the transmitted signal:

| Bits | Phase Change |
| ---- | ------------ |
| `00` | +1/4 π       |
| `01` | +3/4 π       |
| `10` | -1/4 π       |
| `11` | -3/4 π       |

That means that if the phase of the signal *changes* from, say, **0 π** to **3/4 π**, the symbol `01` is represented. If the next phase is then **1 π**, we know the symbol `00` is represented next (because a change of +1/4 π occurred).

If you know a bit of trigonometry, you might know that this means there are eight possible absolute phases that may be transmitted. It's useful to visualise these as points around the unit circle, around which a full revolution is 2π radians. We transmit a phase reference of 0π before the first symbol is transmitted.

{% svg './dqpsk-constellation.drawio.svg' %}

The possible phase states and transitions between them are visualised above.

In this cartesian view, we can see that the X/Y (or In-Phase & Quadrature; or Real & Imaginary) values for the distinct absolute phases are as follows, starting with the fully in-phase point on the rightmost side of the constellation and proceeding counter-clockwise.

| Phase   | In-Phase (Real) | Quadrature (Imag.) |
| ------- | --------------- | ------------------ |
| 0       | 1               | 0                  |
| 1 × π/4 | cos(π/4)        | cos(π/4)           |
| 2 × π/4 | 0               | 1                  |
| 3 × π/4 | -cos(π/4)       | cos(π/4)           |
| π       | -1              | 0                  |
| 5 × π/4 | -cos(π/4)       | -cos(π/4)          |
| 6 × π/4 | 0               | 1                  |
| 7 × π/4 | cos(π/4)        | -cos(π/4)          |

### Pulse Shaping

So that's an *"ideal"* view of π/4 DQPSK. In reality though, we can't transmit *instantaneous* transitions between phases. Think about what that might involve - an abrupt step in a sine wave from, say, a phase of 0π to 3/4π. A sharp edge like that would have a very wide bandwidth indeed. In real-world RF systems, we want to carefully control the bandwidth of the signals we transmit.

As an example, here's a sinusoid with a -π/4 jump in phase in the centre of the plot:

{% diagram 'gnuplot', 'sine-step.gp' %}

In reality, each symbol period is actually a shaped waveform that has a peak in the middle where the "true" symbol phase is most closely approximated, but smoothly transitions from and to the preceding and suceeding phases. The function that produces this smoothing effect is a low-pass filter. Typically, an [RRC (Root Raised Cosine)](https://en.wikipedia.org/wiki/Root-raised-cosine_filter) filter might be used for this type of modulation.

This type of filter can be implemented as a discrete-time digital [FIR (Finite Impulse Response)](https://en.wikipedia.org/wiki/Finite_impulse_response) filter in software. 

This is a *vast* sub-field of digital signal processing, so I'd definitely recommend wider reading! If you're new to this concept, there's a great [Computerphile](https://www.youtube.com/watch?v=C_zFhWdM4ic) video on image blurs & filters that might make a good intro. {.note}

In simple terms, the process of applying a filter is a *convolution*. We take an *impulse response* - basically *the output we'd expect if an impulse were input into the filter function* - and use that as a *filter kernel*. ^[The TETRA specification defines a frequency-domain RRC rolloff shape as a piecewise function and then defines the time-domain filter kernel as the inverse Fourier Transform of that spectrum. See EN 300 392-2 § 5.5. From what I have gathered, this is a fairly common way of describing *theoretical* or *ideal* filters, but the actual filters as-implemented in software might be designed by different means.]

{% diagram 'gnuplot', 'rrc-impulse.gp' %}

We take a buffer, and shift samples into it from the left, shifting out the oldest sample on the right. After shifting in a new sample, we *convolve* the buffer with the filter kernel - that is to say we multiply each sample in the buffer with the corresponding value in the filter kernel and sum the results together. This gives us a stream of filtered output samples.

## In Reality

So that's the theoretical side of things covered. Let's take a look at some *real-world* stuff.

The first thing I wanted to do was find a way to *see* the result of the modulation. I figured X/Y mode on my 'scope might be the best bet^[If that didn't work, I was thinking about something with [gnuplot](http://www.gnuplot.info/), but that wouldn't be real-time. Maybe something animated with [matplotlib](https://matplotlib.org/)? Isn't open source wonderful?]. I set up the Raspberry Pi Pico 2 and a dual I2S DAC - [TI PCM5102A](https://www.ti.com/lit/ds/symlink/pcm5102a.pdf). This DAC is actually intended for audio, so certainly isn't *ideal* for generating baseband I/Q signals, but it'll do the job for this experiment. It's capable of up to 384,000 samples/second which is ample for an 18,000 symbols/second signal.

(Photo of the setup)



