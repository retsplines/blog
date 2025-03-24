---
title: Introduction to TETRA - Part 2
description: Part 2 of some info-dumping about TETRA
tags: [tetra, radio, software, tetra-intro]
draft: true
---

This post is a continuation of my *Introduction to TETRA* series. In this post I'll be finishing off describing the Lower MAC by talking about the Logical Channels.

## Logical Channels

Logical channels are where things start to get a little bit complicated.

Logical channels are communication pathways with specific purposes between the BS & one or more MSs. Essentially, they are how the physical (radio) layer identifies the meaning of the conveyed data to the MAC layer.

Some logical channels are identified & defined entirely by the multiframe number & timeslot number of the slot in which they appear (I.e. by *when* the bits are transmitted); while other mappings are explicitly identified in the MAC protocol (I.e. some additional data is transmitted alongside the data to identify it to the MAC - we'll get to that).

The Normal Downlink Burst and Normal Uplink Burst are both able to contain two blocks of bits. These blocks can either be viewed by the MAC as a single logical channel or two distinct logical channels.

The logical channels have a hierarchical structure, divided into the Traffic logical channels:

* TCH/S - Speech
* TCH/*n* - Circuit-mode data, where *n* identifies a specific bit-rate and error protection level:
    * TCH/2.4 - 2.4kbps (highest level of protection)
    * TCH/4.8 - 4.8kbps (lower level of protection)
    * TCH/7.2 - 7.2kbps (unprotected data)

...and the Control logical channels:

* SCH - Signalling
    * SCH/F - Full-size
    * SCH/HD - Half-size, Downlink
    * SCH/HU - Half-size, Uplink
* BCCH - Broadcast Control
    * BNCH - Broadcast Network
    * BSCH - Broadcast Synchronization
* LCH - Linearisation
    * CLCH - Common Linearisation (MSs)
    * BLCH - Broadcast Linearisation (BS)
* STCH - Stealing
* AACH - Access Assignment

The Traffic logical channels are fairly self-explanatory. For circuit-mode data, higher rate channels are possible through combining multiple Traffic physical channels into the same Traffic logical channel (multi-slot).

The Signalling channels are the mechanism by which MAC PDUs are transported. Two sizes are available on both the uplink and downlink - full slot and half-slot.

The Broadcast Network Channel carries system information about the network (including radio & MAC parameters, details about neighbouring cells, and information needed by MSs to make random access attempts). 

The Broadcast Synchronisation Channel carries synchronisation information for MSs attempting to acquire a BS, including the slot, frame and multiframe number. The Downlink Synchronisation Burst is always used to transmit this channel.

The Stealing channel is an interesting aspect of the protocol. It is actually mapped to *Traffic* physical channels, despite being a Control logical channel. The Stealing channel is used when the BS or an MS needs to transmit important signalling during a call that can't wait for the next Control Frame. A typical use case is at the end of a call - the MS can simply mark a traffic channel sub-slot as stolen, then use it to transmit the call-end signalling to the BS. Similarly, if a high-priority message needs to be sent to an MS during a call, the BS may steal half a slot of the traffic channel to convey this message, rather than wait for the next Control Frame. Stealing is a powerful feature of the TETRA MAC, but is used sparingly because it degrades the traffic channel from which capacity is stolen.

The Access Assignment channel is a special-purpose, downlink-only channel used by the BS to indicate the usage of the downlink slot in which it is transmitted (I.e. to identify which physical channel type is present), and the usage/availability of the corresponding uplink slot (which will start one slot later). It is actually included in *every* data-carrying downlink burst during a 30-bit period between the two sub-slots called the "Broadcast Block". The same MAC message (`ACCESS-ASSIGN`) is always transmitted in every occurrence of the AACH.

The Linearisation channels provide slots in which Linearisation Bursts may be transmitted. For the BS, the Broadcast Linearisation Channel is used. For MSs, the Common Linearisation Channel is used. Because the content of the bursts doesn't matter, the Common Linearisation Channel may be used by any MSs that need to perform linearisation at that opportunity.

### Logical Channel Multiplexing & Stealing

There are occasions when two logical channels need to be transmitted inside a single timeslot. TETRA has a clever trick involving the training sequences in the middle of the Normal Downlink Burst and Normal Uplink Burst to achieve this.

When the two blocks within one of these bursts actually contains two distinct logical channels, an alternative training sequence is used for these bursts. This "bit", conveyed by the use of either one training sequence or the other, is referred to as the "slot flag". On Control Physical channels, the presence of the slot flag indicates that two distinct logical channels are present (SCH/HD and SCH/HD) as opposed to a single signalling channel (SCH/F). On Traffic Physical channels, the presence of the slot flag indicates that the first subslot has been stolen. The contents of *that* slot can be used to determine whether the second subslot is also stolen.

### Error Control

Error control (being able to detect and potentially correct errors in received messages) is essential in digital radio communication. TETRA uses a range of techniques to achieve this. Each logical channel type combines a specific set of error control schemes appropriate to the role of that channel within the protocol. I'll discuss each of the error control techniques here at *very* high level.

#### Reed-Muller Code

The [Reed-Muller Code](https://en.wikipedia.org/wiki/Reed%E2%80%93Muller_code) is a type of error control scheme used exclusively to protect the Access Assignment Channel (AACH) contained within the Broadcast Block of all data-carrying downlink bursts.

The code is applied to the 14 bits of AACH data to produce a 30-bit sequence that fits in the Broadcast Block of downlink bursts.

The AACH contains critical information about the use of downlink slots, as well as the assignment of radio resource for MSs to transmit on the uplink. If the AACH cannot be reliably decoded, there is a risk of protocol instability. As such, the rate of successful reception of this channel is used as a bellwether for the quality of the radio link between BS & MS in TETRA radio link quality calculations and cell selection algorithms.

#### CRC

All signalling channels with the exception of the AACH use a 16-bit [CRC](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) "block code" to protect their contents. This code allows the MAC to detect errors and avoid passing erroneous content to higher layers.

Blocks that arrive with CRC errors are discarded by the MAC.

#### Convolutional Coding

This is the one that most people seem to mention when they're talking about TETRA - the [Rate-Compatible Punctured Convolutional Code](https://en.wikipedia.org/wiki/Convolutional_code) or *RCPC*. At the time TETRA was being developed, the inclusion of this type of error control scheme was fairly unique among similar digital *Professional Mobile Radio* technologies. 

All logical channel types with the exception of the AACH use this type of code.

In high-level terms, the encoding process involves taking each input bit along with a shift register state, producing *n* output bits based on a polynomial function. The final output from processing all input bits with this function - the *mother code* - is considerably longer than the input. However, it contains a sufficient level of redundancy such that the mother code can then be "punctured" by effectively throwing-away specific bits to produce a higher-rate code with a shorter output. The degree of puncturing can be varied to achieve a desired trade-off between code rate and redundancy.

At the receiver, the puncturing process can be reversed and an algorithm is used to recover the original data. The classic algorithm for achieving this is the [Viterbi algorithm](https://en.wikipedia.org/wiki/Viterbi_algorithm). This algorithm finds the *most likely* sequence of input bits that resulted in the received/observed output bits (after de-puncturing).

#### Interleaving & Scrambling

Interleaving and scrambling are interesting information theory solutions to a very physics-focussed problem.

To understand the reasoning behind scrambling, we first need to discuss some of the causes of loss of channel quality that can affect digital radio communications. 

[*Fading*](https://en.wikipedia.org/wiki/Fading) is a phenomenon whereby the attenuation of a radio channel varies over time. This can happen for many reasons, including simple things like shadowing (physical obstructions to the radio signal casting "shadows"). 

*Fast-fading* is a type of fading that varies quickly, usually as a result of [*multipath interference*](https://en.wikipedia.org/wiki/Multipath_propagation) where reflected signals destructively interfere with one another. As mobiles move physically (for example in a vehicle), they enter and leave "fringes" of high and low receive level at a rate that can be close to the symbol rate of the signal. In TETRA, this might mean that particular symbol-ranges of each slot of a downlink channel are unrecoverable for an MS, leading to radio link failure.

One of the applications of Scrambling in the TETRA MAC is to mitigate this type of fading. Scrambling uses a [Linear-Feedback Shift Register](https://en.wikipedia.org/wiki/Linear-feedback_shift_register) to effectively randomise the positions of output bits within a block of transmitted data. This means that periodic errors imposed by fast fading do not affect the same raw bit positions each time.

Scrambling also serves another purpose. The initial state of the LFSR - called the "extended colour code" - for most channels^[The Broadcast Synchronisation Channel (BSCH) scrambling LFSR is initialised to all-0s, since MSs need to decode this channel before registering and before knowing the MCC/MNC/BCC] is actually derived from the Mobile Network Code, Mobile Country Code (MNC/MCC) of the TETRA network and the BS Colour Code^[A 6-bit value unique to a given cell] of the associated BS. This means that only MSs with the correct extended colour code will be able to decode frames. This is particularly important where neighbouring countries have TETRA networks that re-use frequencies.

Another common property of errors in radio systems is that they are often "bursty", affecting a contiguous time period within the data stream. Interleaving seeks to spread these errors so that they are distributed across the block of data more evenly. This makes the job of the error correcting codes more straightforward, since single blocks of many errored bits are converted into many single errored bits distributed across the block.
