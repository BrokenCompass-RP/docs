---
title: 'BCRP-Evidence'
description: 'Development roadmap for the planned Broken Compass evidence and forensic ecosystem.'
default_visibility: developer
---
# bcrp-evidence

# Development Roadmap

## Vision

Create a persistent forensic ecosystem for Broken Compass RP where evidence is created by world actions, collected through proper procedures, processed through forensic systems, connected to investigations, reviewed by medical professionals, and challenged through legal roleplay.

Evidence is not a police feature.

Evidence is a world state system.

# Milestone 1 — Core Evidence Framework

## Goal

Build the foundation that all future evidence systems depend on.

## Focus

Persistence, ownership, tracking, APIs.

## Features

### Evidence Registry

Create persistent evidence objects.

Supported:

- Unique evidence IDs

- Evidence categories

- Metadata storage

- Creation timestamps

- Collection status

- Processing status

- Linked cases

Example:

Evidence #BC-000482

Type:
 Blood Sample

Status:
 Collected

Identity:
 Unknown

### Database Layer

Tables:

- evidence_records

- evidence_profiles

- evidence_processing

- evidence_chain_of_custody

### Chain of Custody Engine

Track:

- Created

- Discovered

- Collected

- Transferred

- Processed

- Stored

- Removed

- Destroyed

Every interaction becomes history.

### Developer API

Expose:

CreateEvidence()

GetEvidence()

UpdateEvidence()

TransferEvidence()

AttachToCase()

SearchProfiles()

Deliverable:

A working backend where evidence can exist without police interaction.

# Milestone 2 — Police Evidence Collection

## Goal

Replace simple collection mechanics with investigative gameplay.

## Features

### Evidence Kit

Deployable ox_inventory item.

Creates an interactable forensic kit.

Tools:

Fingerprint brush

Fingerprint tape

Evidence bags

Blood swabs

Alternate light sources

Tweezers

Camera

### Collection Gameplay

Officers locate evidence.

Evidence begins unidentified.

Example:

Before processing:

Unknown Blood Sample

NOT:

John Smith’s Blood

### Evidence Quality

Track:

Collector

Collection method

Scene conditions

Possible contamination

Deliverable:

Officers can find, package, and store evidence.

# Milestone 3 — Evidence Generation System

## Goal

Make player actions leave traces.

## Features

### Firearms

Generate:

Casings

Gunshot residue

Weapon fingerprints

### Injuries

Generate:

Blood

DNA traces

Impact evidence

### Vehicles

Generate:

Paint transfer

Collision debris

Fingerprints

### Scene Persistence

Evidence remains after players leave.

Configurable decay:

Blood

Casings

Fibers

Prints

Deliverable:

Crime scenes naturally exist without manual creation.

# Milestone 4 — Crime Lab Processing

## Goal

Separate evidence collection from evidence knowledge.

## Features

### Processing Stations

Crime labs analyze collected evidence.

### Fingerprint Analysis

Unknown print becomes:

Fingerprint Profile #39492

Database search begins.

### DNA Processing

Blood becomes:

DNA Profile

Possible match

Unknown profile storage

### Ballistics

Compare:

Casings

Projectiles

Weapons

### Cold Case Matching

Future database updates can trigger old evidence matches.

Deliverable:

Evidence becomes intelligence only after proper analysis.

# Milestone 5 — MDT Integration

## Goal

Connect investigations without making MDT own evidence.

## Integration Model

bcrp-evidence remains source of truth.

MDT consumes data.

Features:

Evidence tab

Case attachments

Lab reports

Processing status

Evidence search

Example:

Case #2001

Evidence:

3 Blood Samples

2 Fingerprints

1 Weapon

Lab Results Pending

Deliverable:

Detectives can build investigations.

# Milestone 6 — Evidence Storage System

## Goal

Create accountability.

## Features

Evidence lockers

Case storage

Access permissions

Audit history

Evidence transfers

Chain Example:

Collected:
 Officer Adams

Stored:
 Evidence Locker

Processed:
 Crime Lab

Reviewed:
 Detective

Presented:
 Court

Deliverable:

Evidence can be trusted or challenged.

# Milestone 7 — Medical Examiner Expansion

## Goal

Allow medical professionals to contribute forensic evidence.

## Features

Autopsy Reports

Cause of injury

Time estimates

Projectile removal

Toxicology

DNA collection

Medical documentation

Examples:

Gunshot Victim

Recovered:

9mm projectile

Blood sample

Residue evidence

Deliverable:

EMS/medical RP becomes part of investigations.

# Milestone 8 — Legal / DOJ Expansion

## Goal

Turn evidence into courtroom gameplay.

## Features

Discovery System

Defense Access

Evidence Review

Chain Challenges

Expert Reports

Lawyers Can Review:

Who collected evidence

When it moved

How it was processed

Potential contamination

Missing procedures

Deliverable:

Evidence creates court RP instead of only arrests.

# Milestone 9 — Criminal Interaction

## Goal

Create counterplay.

## Features

Gloves

Masks

Cleaning supplies

Evidence destruction

Scene staging

Examples:

Gloves:
 Prevent fingerprints

But:
 May leave fibers

Cleaning:
 Removes blood

But:
 Leaves chemical traces

Deliverable:

Criminal preparation affects investigations.

# Milestone 10 — Advanced Forensics

## Goal

Deep investigative gameplay.

## Features

Evidence degradation

Environmental effects

Collection skill

Partial matches

Family DNA

Advanced fibers

Tool marks

Digital evidence

Deliverable:

A complete persistent forensic ecosystem.

# Initial Build Order Recommendation

Version 0.1:
 Core framework

Version 0.2:
 Evidence kit + collection

Version 0.3:
 Scene evidence generation

Version 0.4:
 Lab processing

Version 0.5:
 MDT integration

Version 1.0:
 Police investigation loop complete

Version 2.0:
 Medical + DOJ expansion

Version 3.0:
 Criminal counterplay + advanced systems

I’d probably pin v1.0 as “detective RP complete” and resist adding lawyers before that. The court system only gets interesting once the evidence already has enough history to argue about.
