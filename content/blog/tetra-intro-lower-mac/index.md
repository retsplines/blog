---
title: Introduction to TETRA - The Lower MAC
description: Part 2 of some info-dumping about TETRA. Covers the Lower MAC, Logical Channels & Coding.
tags: [tetra, radio, software, tetra-intro]
hero_image: ./silly-sds.jpeg
date: 2025-04-20
---

This is the second post in my *Introduction to TETRA* series. In this post I'll be describing the Lower MAC by talking about the Logical Channels.

First, I'll define some of the terminology used by this part of the stack, then move on to defining the Logical Channels and finally the error control schemes they employ.

## Worked Examples & Code

While experimenting with TETRA, I've written quite a bit of code to work with the Lower MAC primitives, in particular the error control schemes described in this post. I've [published](https://github.com/retsplines/tetra-lower-mac) some of this code on GitHub. I make no assertions as to the quality or correctness of this code, but corrections and additions are most welcome!

## Primer: Services, SAPs & Primitives

When I first started looking at descriptions of digital radio communications systems, a few terms came up constantly which seem to have been lost to time in a world of ubiquitous IP networking where most of the gritty low-layer stuff is taken care of.

Most of these terms seem to come from (?) an ISO Technical Report - ["OSI Service Conventions" ISO/TR 8509](https://cdn.standards.iteh.ai/samples/15732/480d37ec95324577a446bfb45203ced0/ISO-TR-8509-1987.pdf), published in 1987. This TR builds on the "OG" ISO standard on networking - ["Open Systems Interconnection - Basic Reference Model" ISO 7498](https://www.iso.org/standard/14252.html). This is the document that defines the "OSI Model" that has haunted Computer Science networking students ever since it was published in 1984.

### Primitives & SAPs

You'll see things called *Primitives* and *SAPs* (Service Access Points) mentioned a lot in ETSI protocol specifications. 

A *SAP* is essentially a conceptual endpoint of a service within the network stack of a peer at which *primitives* are exchanged with other services.

{% svg './sap.drawio.svg' %}

A *primitive* is a way of modelling a communication between services in the network stack. There are four types of primitive defined:

* `Request` - A service-user invokes a procedure within a service-provider.
    * `Confirm` - A service-provider confirms that a previously-`Request`ed procedure has been completed.
* `Indication` - A service-provider indicates that some procedure bas been invoked internally.
    * `Response` - A service-user indicates that it has completed the procedure previously invoked by an `Indication`.

Something I feel it's important to understand at this point is that the shape and format of primitives is not defined - these aren't PDUs like TCP packets or HTTP requests. They're *conceptual* - in the real-world implementation they might be method calls or procedure invocations or other type of system stimulus^[As an aside, I'm very interested to understand how well this model is adhered-to by implementations. Is this way of describing the functional parts of a network stack such as TETRA simply a vehicle for the description, or taken more literally by designers?].

A typical example might be a service that sends and receives Morse Code messages. This service listens to the stream of Morse Code signals on a wire and exposes a SAP at which valid messages are provided to service-users. Service-users may also submit messages to transmit at the SAP.

When the Morse Code service receives a complete, error-free message, it notifies service users with an `Indication` primitive. When a service user finishes processing the message, it submits a `Response` primitive. 

When a service user wishes to *send* a Morse Code message, it submits the message using a `Request` primitive at the SAP. When the Morse Code service finishes sending the message ("finish" in this context may mean success, failure or some other indeterminate result), it submits a `Confirm` primitive.

## The Lower MAC

The TETRA MAC is divided into two distinct functional sections - the *Upper* and *Lower* MAC. As the names suggest, the Lower MAC interfaces with the physical layer and the Upper MAC interfaces with the Lower MAC below and the rest of the protocol stack above. 

{% svg './mac-structure.drawio.svg' %}

The interface between the Upper MAC and Lower MAC is the **TMV-SAP**. At this boundary, MAC blocks (which are sequences of bits containing one or more concatenated, pre-formed MAC messages) are exchanged along with the identification of the *logical channel* they belong to.

The interface between the Lower MAC and the physical layer is the **TP-SAP**. At this boundary, multiplexed blocks (which are sequences of coded, scrambled bits) are exchanged, along with the identification of the type of block they belong to. These map directly to the blocks within the [RF Bursts](/blog/tetra-intro-phy/#rf-bursts) covered in the last post.

The role of the Lower MAC is to perform the coding of outgoing blocks of information and the decoding of incoming blocks from received bursts.

The Upper MAC's responsibilities include fragmentation of long messages into multiple MAC blocks, association of short messages into single MAC blocks, random access and more. The vast majority of the complexity of the TETRA MAC is contained within the Upper MAC, which I'll describe in a future post.

## Logical Channels

Logical channels are where things start to get a little bit complicated.

Logical channels are communication pathways with specific purposes between the BS & one or more MSs. Essentially, they are how the lower MAC identifies the meaning of the conveyed data to the upper MAC.

When the Upper MAC wishes to send a MAC Block, it indicates to the Lower MAC at the TMV-SAP which logical channel the block belongs to. This dictates the coding that the Lower MAC applies, and the burst type that will be used to transmit the coded bits.

The logical channels have a hierarchical structure, divided into the **traffic** logical channels:

* TCH/S - Speech
* TCH/*n* - Circuit-mode data, where *n* identifies a specific bit-rate and error protection level:
    * TCH/2.4 - 2.4kbps (highest level of protection)
    * TCH/4.8 - 4.8kbps (lower level of protection)
    * TCH/7.2 - 7.2kbps (unprotected data)

...and the **control** logical channels:

* SCH - Signalling
    * SCH/F - Full-size
    * SCH/HD - Half-size, Downlink only
    * SCH/HU - Half-size, Uplink only
* BCCH - Broadcast Control
    * BNCH - Broadcast Network
    * BSCH - Broadcast Synchronization
* LCH - Linearisation
    * CLCH - Common Linearisation (MSs)
    * BLCH - Broadcast Linearisation (BS)
* STCH - Stealing
* AACH - Access Assignment

The traffic logical channels are fairly self-explanatory. For circuit-mode data, higher rate channels are also possible through combining multiple traffic physical channels into the same traffic logical channel (multi-slot).

The Signalling channels are the mechanism by which MAC PDUs are transported. Two sizes are available on both the uplink and downlink - full slot and half-slot.

The Broadcast Network Channel carries system information about the network (including radio & MAC parameters, details about neighbouring cells, and information needed by MSs to make random access attempts). 

The Broadcast Synchronisation Channel carries synchronisation information for MSs attempting to acquire a BS, including the slot, frame and multiframe number. The Downlink Synchronisation Burst is always used to transmit this channel.

The Stealing channel is an interesting and fairly unique feature of the TETRA MAC. It is actually mapped to *traffic* physical channels, despite being a control logical channel. The Stealing channel is used when the BS or an MS needs to transmit important signalling during a call that can't wait for the next Control Frame. It achieves this by stealing traffic channel capacity to use for signalling. A typical use case is at the end of a call - the MS can simply mark a traffic channel sub-slot as stolen, then use it to transmit the call-end signalling. Similarly, if a high-priority message needs to be sent to an MS during a call, the BS may steal half a slot of the traffic channel to convey this message, rather than wait for the next Control Frame. Stealing is a powerful feature of the TETRA MAC, but is used sparingly because it degrades the traffic channel from which capacity is stolen. For example, the quality of a voice call will be degraded when capacity is stolen from a TCH/S channel.

The Access Assignment channel is a special-purpose, downlink-only channel used by the BS to indicate the usage of the downlink slot in which it is transmitted (I.e. to identify which physical channel type is present), and the usage/availability of the corresponding uplink slot (which will start one slot later). It is actually included in *every* data-carrying downlink burst during a 30-bit period between the two sub-slots called the "Broadcast Block". The same MAC message (`ACCESS-ASSIGN`) is always transmitted in every occurrence of the AACH.

The Linearisation channels provide slots in which Linearisation Bursts may be transmitted. For the BS, the Broadcast Linearisation Channel is used. For MSs, the Common Linearisation Channel is used. Because the content of the bursts aren't meaningful, the Common Linearisation Channel may be used by any MSs that need to perform linearisation at that opportunity.

## Logical Channel Multiplexing

There are occasions when two logical channels need to be transmitted inside a single timeslot. TETRA has a clever trick involving the training sequences in the middle of the [Normal Downlink Burst](/blog/tetra-intro-phy/#downlink-bursts) and Normal Uplink Burst to achieve this.

When the two blocks within one of these bursts actually contains two distinct logical channels, an alternative training sequence is used for these bursts. This single bit of information, conveyed by the use of either one training sequence or the other, is referred to as the "slot flag". On control physical channels, the presence of the slot flag indicates that two distinct logical channels are present (SCH/HD and SCH/HD) as opposed to a single signalling channel (SCH/F). 

### Stealing

The slot flag is also used to indicate that the stealing procedure has taken place.

On traffic physical channels, the presence of the slot flag indicates that the first subslot has been stolen. The contents of *that* slot can be used to determine whether the second subslot is also stolen.

## Error Control

Error control (the ability to detect and potentially correct errors in received messages) is essential in digital radio communication. TETRA uses a range of techniques to achieve this. 

{% svg './error-control.drawio.svg' %}

In the diagram above, the `n,m` notation represents `n` bits *out* and `m` bits *in*. The `x/y` notation represents the puncturing degree of the RCPC used.

Each type of logical channel combines a specific set of error control schemes appropriate to the role of that channel within the protocol. I'll discuss each of the error control techniques here at high level.

### Reed-Muller Code

The [Reed-Muller Code](https://en.wikipedia.org/wiki/Reed%E2%80%93Muller_code) is a type of error control scheme used exclusively to protect the Access Assignment Channel (AACH) contained within the Broadcast Block of all data-carrying downlink bursts.

The code is applied to the 14 bits of AACH data to produce a 30-bit sequence that fits in the Broadcast Block of downlink bursts.

The AACH contains critical information about the use of downlink slots, as well as the assignment of radio resource for MSs to transmit on the uplink. If the AACH cannot be reliably decoded, there is a risk of protocol instability. As such, the rate of successful reception of this channel is used as the indication for the quality of the radio link between BS & MS in TETRA radio link quality calculations and cell selection algorithms.

### CRC

All signalling channels with the exception of the AACH use a 16-bit [CRC](https://en.wikipedia.org/wiki/Cyclic_redundancy_check) "block code" to protect their contents. This code allows the MAC to detect errors and avoid passing erroneous content to higher layers.

Blocks that arrive with CRC errors are discarded by the MAC.

### Convolutional Coding

This is the one that most people seem to mention when they're talking about TETRA - the [Rate-Compatible Punctured Convolutional Code](https://en.wikipedia.org/wiki/Convolutional_code) or *RCPC*. At the time TETRA was being developed, the inclusion of this type of error control scheme was fairly unique among similar digital *Professional Mobile Radio* technologies. 

All logical channel types with the exception of the AACH and unprotected traffic use this type of code.

In high-level terms, the encoding process involves taking each input bit along with a shift register state, producing *n* output bits based on a polynomial function. The final output from processing all input bits with this function - the *mother code* - is considerably longer than the input. However, it contains a sufficient level of redundancy such that the mother code can then be "punctured" by effectively throwing-away specific bits to produce a higher-rate code with a shorter output. The degree of puncturing can be varied to achieve a desired trade-off between code rate and redundancy.

At the receiver, the puncturing process can be reversed and an algorithm is used to recover the original data. The classic algorithm for achieving this is the [Viterbi algorithm](https://en.wikipedia.org/wiki/Viterbi_algorithm). This algorithm finds the *most likely* sequence of input bits that resulted in the received/observed output bits (after de-puncturing).

### Interleaving

Interleaving is an interesting information theory solution to a very physics-focussed problem.

A common property of errors in digital radio systems - particularly those caused by *fast fading*^[A phenomenon whereby the signal strength of a radio channel varies over time as a result of [*multipath propagation*](https://en.wikipedia.org/wiki/Multipath_propagation). *Fast fading* is a type of fading that varies quickly - over distances of about half a wavelength. When reflected and/or diffracted signals arrive with phase offsets of around half a wavelength, they destructively interfere with one another and reduce the received signal level. As a mobile moves, many of these _fades_ can be experienced per second, appearing as periodic bursts of low receive strength] - is that they are often "bursty", affecting a contiguous sequence of bit-periods within the data stream. Interleaving seeks to spread these errors so that they are distributed across the block of data more evenly. This makes the job of the error correcting codes more straightforward, since blocks of many errored bits are converted into many single errored bits distributed across the block.

To understand the reasoning behind interleaving, we first need to discuss some of the causes of loss of channel quality that can affect digital radio communications. 

Interleaving is used in the TETRA MAC to work with other coding schemes to help mitigate this type of fading. In the diagram below, a burst error affects bit periods (and bit *numbers*) 47-63.

{% svg './interleaving-periods.drawio.svg' %}

When interleaving is applied, bit numbers that are next to one another in the input data stream no longer occupy bit periods that are next to one another in time, so the burst error is "spread" across the data stream rather than being concentrated to a contiguous set of bits:

{% svg './interleaving-interleaved.drawio.svg' %}

Now, with the same burst of unrecoverable bit periods, bit *numbers* 38, 49, 60, 71, 82, 93, 104, 115, 6, 17, 28, 39, 50, 61, 72, 83 and 94 are affected instead - the burst error has been effectively distributed across the data stream.

### Scrambling

Scrambling uses a [Linear-Feedback Shift Register](https://en.wikipedia.org/wiki/Linear-feedback_shift_register) to XOR transmitted data with a pseudorandom value. 

The initial state of the LFSR - called the "extended colour code" - for most channels is actually derived from the Mobile Network Code, Mobile Country Code (MNC/MCC) of the TETRA network and the BS Colour Code^[A 6-bit value unique to a given cell] of the associated BS. This means that only MSs with the correct extended colour code will be able to decode frames. This is particularly important where neighbouring countries have TETRA networks that re-use frequencies.

The Broadcast Synchronisation Channel (BSCH) scrambling LFSR is initialised to all-0s, since MSs need to decode this channel before registering and before knowing the MCC/MNC/BCC.

## Next Time

Next time, things should be a little less dry, I promise. I'll be looking at the Upper MAC, which contains a most of the MAC functionality, as well as the LLC (Logical Link Control) layer.
