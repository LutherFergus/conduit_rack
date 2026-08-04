PWA v1.64 OD skin stagger

v1.64: Rolled-offset mark stagger includes surface-gap×projection (with CTC×tan(θ/2)×|horiz|/TO) so rack-plane travel keeps OD skins clear. Collision checks use outer-skin clearance (centerline − rA − rB) with 1e-4" tolerance. When Auto Space is ON, swept OD collisions (rolled saddle pinch at non-corresponding stations, mixed-CLR 90/kick/segmented sweeps) automatically widen affected CTC like Fix CTC. Fixed populate*TestRack ternary bug that forced directions to defaults whenever randomize was false.

v1.63: Removed in-app Grok chat, API key UI, and xAI proxy. App is local-first again. serve.py is a plain static file server only. Parallel offset mark progression restored to the established formula (see below).

v1.63b: Offset mark families: Standard = pure vertical (shared critical). Parallel = pure horizontal (full CTC×tan(θ/2) + surface-gap stagger). Rolled = partial standard + partial parallel (stagger × |horizontal|/TO). Travel = TO/sinθ, shrink = TO×tan(θ/2). Never force identical marks on parallel or rolled.

v1.62: (removed) Temporary Grok command-line experiment for live rack Q&A.

v1.61: DOM/fields for 90 layout use class .bon (back of 90). Offset/saddle finished A-to-B overall length keeps class .oal. Project rows save bon/autoBon for 90 types (load still accepts legacy oal). Geometry reads dataBackOf90(d).

v1.60: Severed OAL from Back of 90. OAL = finished linear A→B after bends (shortened by shrink); stick developed for offset/saddle = OAL + shrink when OAL is on. Back of 90 remains the 90 layout station (first-leg to outside of 90) for basic/kicked/segmented geometry and marks — labels no longer call it OAL.

v1.59: Developed Length is STICK material length. A full stick stood on the floor is 120". Never stick+gain. Offset/saddle: when finished OAL is entered, developed = OAL + shrink (trade rule). 90-family: developed = centerline stick path (≤ progressive stick). After-bend floor legs (M1+M2) relate by gain: floor ≈ stick + gain — that is a check, not the cut length. 2×CTC still shortens stick from outside.

v1.58: Developed length formula corrected toward stick budget (superseded by v1.59 stick + shrink rules).

v1.57: Rack 90 free ends (basic and kicked) progress by 2×CTC from the outside conduit (1st leg + 2nd leg rule): outside longest second leg, each step inward shortens free end by 2×|Δpos|. Same-way multi-section 90s stack free-end stagger; opposite-way 90s cancel. Trim Mode (default ON) squares free ends per section; Trim Off column only when scrap is needed. Multi-section joint leads are stored and offset bend marks display from the coupling (layout mark + joint lead). Shared section frames and geometry monitor retained.

v1.56: Geometry monitor continuously checks combined multi-section runs (joint gaps, frame roll, OD collisions, stock overlength). Multi-section composition now uses one shared traveling frame per section so later bends do not pick up per-conduit roll. Developed Length matches the field floor method (sum of both legs measured from a straight edge after the bend): L_out + OD gain, where L_out is the OD long-side path (centerline + Σ (OD/2)·θ). Gain is OD/long-side gain; stick check ≈ developed − gain. Trim Mode toggle in Format auto-squares every rack section to the shortest free end before struts and collisions; with Trim Mode off, full stick stubs remain for downstream strut placement. Offset verticalSign crash path fixed. Custom-run collision detection restored after section joins.

v1.55: Replaced the visible Rack Parameters and Formulas panels with a compact top control bar for Format, Auto Space, and Test. Each active conduit card is titled by section number and contains its own conduit count, bend type, direction, and relevant bend settings. Added a collapsible Struts card with separate horizontal and vertical average spacing, automatic placement only on straight horizontal or vertical portions, calculated strut cut lengths, per-strut Top/Bottom selection, downstream propagation, and Edit Solo overrides. Build/Rebuild is no longer required because changing the section conduit count rebuilds automatically. Trim Rack is now named Trim Section and remains available only for the newest section so established downstream bends are never silently relocated. Mobile Capture now uses a more tolerant native file-sharing check so iOS/Android can present Save Image/Photos even when canShare reporting is inconsistent; desktop Capture continues downloading directly.

v1.54: Bend Type, style, and bend-direction controls now live at the top of the Conduit Layout card so the controls are visibly attached to the Rack or Single Conduit section they affect. In Custom Run, the shared conduit card moves into the active section and its Bend Type selector changes only that section; prior sections remain labeled and collapsed.

v1.53: Basic 90 setup now prompts for Up, Right, Left, or Down in both Single Conduit and Rack workflows, and the selected direction rotates the actual 3D bend. Custom Run section cards now place direction controls above the conduit editor for Basic 90s, Kicked 90s, offsets, saddles, and segmented bends. Negative directional measurements are supported: negative offset or saddle rise selects Down, negative rolled offset distance selects Left, and negative Kicked 90 rise selects Down. Direction is interpreted from the electrician's continuous traveling viewpoint looking along the top of the run; each section carries forward the prior section's full forward/top/right frame rather than resetting to global viewer axes. Added Redo directly beside Undo, with new edits correctly clearing the redo stack.

v1.52: Added fully functional Basic 90 layouts for Single Conduit and Rack. Custom Run sections can now select their own bend model while the active section is expanded; inactive sections remain compact labels. New sections inherit conduit sizes, bender profiles, and CTC spacing from the immediately preceding section. At every added-section joint, all couplings remain attached to their individual conduit ends while the new section's first bend points are aligned on one realistic perpendicular station across the rack; the required difference is absorbed by the straight lead and removed from the far tail so the stick length is preserved. Only the newest section can be removed, and Remove Section appears only at the bottom of that section. Trim Rack remains a manual one-shot action available only for the newest active rack section. Its perpendicular cut plane is established by the physically shortest finished endpoint, preventing any conduit from being cut behind the reference end. Fix CTC is locked to the section where the command began, including queued correction passes. Added a viewer-toolbar Undo command for Trim Rack, section add/remove, section bend-type changes, bend-type changes, Fix CTC, and conduit-data edits.

v1.51: Rebuilt mobile conduit cards as compact two-column workspaces. Input Data occupies the left half and Output Data occupies the right half, with smaller responsive labels and fields. Each half expands and collapses independently. Every bend type now receives the same split-card structure, including Kicked 90 and Straight sections, while the desktop fabrication table remains unchanged. Trim Rack is now a one-shot command instead of an ON/OFF toggle. It creates one perpendicular cut plane through the shortest conduit's endpoint, records the actual Trim Off tail removed from every other conduit in only the active section, visibly aligns those conduit ends, and never changes earlier sections.

v1.50: Added stable viewport anchoring for Custom Run section changes. Numbered controls below the viewer keep the viewer fixed on screen while section editors expand and collapse. Clicking an accordion section header keeps that header fixed instead. Clicking the already-active section no longer rebuilds the accordion. Every conduit now receives a visible metallic coupling sleeve at each connection between Custom Run sections. Trim Rack and Add Section now sit in the viewer toolbar immediately after Fix CTC.

v1.49: Added Custom Run sections, Add Section from every bend mode, automatic 120-inch straight-stick sections, OD/long-side gain and developed length for every bend family, rack Trim values, continuous multi-section viewer geometry with section joints, numbered Section viewer controls, one-open-section accordion editing, and Fly orbit mode enabled by default. Selecting a section number focuses it in the viewer and expands only that section's editor.

v1.48: Connected segmented-bend geometry errors, OD overlaps, and swept-rack collisions to the automatic Project Status popup. The popup now includes the specific segmented conflict and provides CTC correction when spacing can resolve it.

v1.47: Added Segmented 90 for Single Conduit and Rack. Enter a desired centerline radius and either Back of 90 (OAL, default) or Start of Bend. The app creates nine equal 10-degree shots, lists every bend mark, and adjusts rack radii concentrically to preserve OD-based spacing.

v1.46: Added a Bend Type dropdown at the top of the app. It switches directly among Kicked 90, Standard/Rolled Offset, and Standard/Rolled Saddle; Parallel Offset is included only in Rack mode. Selecting a different bend type rebuilds the appropriate shared calculator and keeps the Single/Rack format rules active.
v1.45: Added a Single/Rack format toggle inside the parameters panel. The panel title automatically changes to Parameters for Single Conduit and Rack Parameters for Rack. Switching to Single preserves conduit 1 and locks the table to one row. Switching to Rack preserves conduit 1, restores six rows, enables the conduit-count control, and restores Rack-only Parallel Offset.
v1.44: Added a new first setup menu asking Single Conduit or Rack. Single Conduit uses the same Kicked 90, Standard/Rolled Offset, Saddle, viewer, test, save, and PDF engines as Rack mode, but its conduit count is permanently locked to one—including Test and Hard Test. Parallel Offset remains Rack-only and is hidden throughout Single Conduit mode. This shared-engine design means future rack corrections automatically update Single Conduit mode. Rack retains its established multi-conduit behavior. Compound Offset was removed from the rack-type menu.
v1.43: Offset and Saddle Rack OAL entry is now optional and off by default in Rack Parameters; the ON button is orange. With OAL hidden, the geometry engine uses one common display length beyond the final bend without requiring OAL as fabrication input. Saddle labels now use To Bend 1, First Offset, Between Points 1 & 2, Second Offset, and Between Points 3 & 4. On mobile, every Offset and Saddle conduit card is divided into an Input Data section that starts open and can be collapsed, plus an Output Data section that always remains visible. OAL is also omitted from fabrication PDFs while the feature is off.
v1.42: Reduced the Saddle Rack desktop table and its cells to approximately 50% of their previous width. The compact layout wraps long headings while preserving full-size touch controls in the mobile card layout.
v1.41: Added a functional four-bend Saddle Rack engine with Standard and Rolled styles. Rack Parameters includes Both Same/Both Different opposing-offset control. The table accepts Bend 1, OAL, first offset dimensions, bend angle, Bend 2-to-Bend 3 distance, and optional second offset dimensions. It calculates and displays both true offsets, both travels, both shrink values, and all four bend marks. Saddle geometry, OD-aware 5/8-inch clearance validation, colored struts, testing, saving, capture, and fabrication PDFs share the same geometry model. Arrow-reference layout remains a future optional translation layer and is not required.

v1.40: Compacted conduit cards for iPhone portrait orientation. Offset Rack no longer carries its desktop table width into the mobile card layout, labels and values use tighter responsive columns, and long calculated outputs wrap inside the card instead of forcing horizontal overflow.

v1.39: Added the first functional Offset Rack engine with Standard, Parallel, and Rolled modes. Offset Rack uses two equal opposing bends, persistent top-of-app mode switching, OD-aware CTC spacing, true-offset and travel calculations, first- or second-bend-critical layout, exact finished OAL preservation, 3D conduit rendering, colored origin/destination struts, collision validation, project persistence, test racks, capture, and fabrication PDF support.

v1.38: Offset Rack is now available from the rack-type picker. Selecting it opens a dedicated second prompt with Standard, Parallel, and Rolled choices. Each choice is isolated from the Kicked 90 calculation path while its geometry workflow is developed.

- Detects computer vs mobile/tablet for file output.
- Computers always save captures and fabrication PDFs directly to Downloads, even when the browser supports the Web Share API.
- Phones and tablets continue to use the native share/save sheet when file sharing is supported.

Conduit Rack Calculator PWA v1.31 Viewer Fix CTC

Changes:
- Rack-aware conduit painter ordering is anchored to the first kick center-of-bend on every frame, preventing long tails and mixed conduit diameters from making neighboring conduits visually switch sides as the camera rotates.
- Added Capture beside Open in Rack Data.
- Capture saves a PNG to Downloads on desktop.
- On supported mobile browsers, Capture opens the native share/save sheet so the image can be saved to Photos/Camera Roll; older browsers fall back to a normal image download.
- Existing 60-degree greatest-angle, 80-inch OAL, and 46-inch hypotenuse test limits remain in place.


v1.19 changes:
- Removed the Kick-to-90 conflict status card and its manual correction buttons.
- Automatic kick-clearance correction remains active in the geometry pipeline.


v1.22 changes:
- Removed the Rack planes are aligned Project Status card.
- Removed the Strut transition is consistent Project Status card.
- Kept both underlying geometry validations active.


v1.22 changes:
- Struts are forbidden from occupying kick or bend geometry.
- Preferred station is 4 inches from the free end of the longest conduit.
- Full strut thickness plus 1/8-inch safety margin must remain within shared straight conduit sections.
- If space is tight, the strut moves toward the free ends, never into a bend.


v1.23 changes:
- Strut length now updates automatically as conduits are added or removed.
- Each strut uses the actual rack outside width at its own support station: all conduit diameters plus all gaps.
- Total strut cut length is rack width x 1.26.
- The additional 25% is centered, producing equal overhang on both ends.
- Mixed conduit sizes and unequal gaps are handled from the rendered outside envelopes.


v1.26 changes:
- Made OAL, rise, hypotenuse, and distance-from-strut fully bidirectional.
- A value entered in any row becomes the anchor and recalculates every row above and below.
- Preserved CTC relationships, rack direction, mixed-size rise corrections, collision checks, and the 125% dynamic strut-length rule.


v1.30 changes:
- Project Status is now an automatic popup only when a true error occurs.
- Popup contains all existing project checks and has a Close button.
- Both correction actions are labeled Fix CTC.
- Spacing Mode is removed. Auto Space remains available and defaults ON.


v1.30 changes:
- One Fix CTC action now solves straight spacing and bend-radius collisions together.
- Radius collisions remain explicitly identified by conduit pair, clearance, current CTC, and minimum corrected CTC.
- Fix CTC repeats geometry checks until all affected pairs clear, then closes Project Status automatically.


v1.31 changes:
- Added a Fix CTC button immediately to the right of Fit to Model in the 3D viewer toolbar.
- The viewer button calls the same unified CTC repair used by the Project Status popup.
- Fix CTC continues to resolve both straight-spacing requirements and identified bend-radius collisions.


v1.33: Auto Space now starts ON for every fresh session and returns ON when Clear Values starts a new project. Saved projects continue restoring their saved Auto Space state.


v1.34: Kick-before-90 geometry now includes each conduit's exact shrink when locating the kick center. The solver uses OAL - horizontal run - shrink (equivalent to OAL - hypotenuse), keeping all kick centers on the same rack station while preserving each conduit's rise, angle, radius, and finished OAL. Galvanized gray strut coloring remains enabled.


v1.35: Auto Space is ON for every fresh session and reset. Build/Rebuild and test rack generation no longer switch it OFF. Only the user pressing the Auto Space toggle can turn it OFF. The active ON state is shown with an orange button.


v1.36: The first/origin strut is rendered blue and the second/destination strut is rendered purple. The same assigned strut colors are used by the 3D viewer, captures, and PDF rendering.

v1.37: The first/origin strut is solid orange and the second/destination strut is solid purple. Shading gradients were removed from both struts in the viewer, captures, and PDF rendering.
