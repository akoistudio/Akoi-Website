# Mushroom lamp and E27 mount research

Reference interpretation: a wide low conical cap and a tall cylindrical glowing stem. Dimensions are estimates from images, not measured copies. The studio generates its own parametric geometry.

Sources checked 2026-10-07:
- https://lampmaker.app/ — browser parametric shape/pattern/surface editing, separate shade/base and assembled views, printer/material setup. Its accessible page explicitly describes a Bambu puck collar; it does not establish universal E27 mount dimensions. No source geometry or models copied.
- https://www.bjb.com/en/lampholder-e27/22.329.4001-0 — manufacturer's E27 holder uses screw fixing. Confirms that bulb designation does not specify one mounting interface.
- https://www.lampholders.eu/en-us/shade-ring-for-lampholder-e27-in-metal/ — supplier's own threaded shade-ring specification lists 40 mm thread with 2.5 mm pitch and 60 mm outside diameter. The app's 40 mm barrel and 56 mm ring are editable starting estimates, not a promise of fit to this product.
- https://thangs.com/prints/designer/SN'D%20Studio/3d-model/Mushroom%20Lamp-1102343 — designer's description separates base, shade, connector and cap and uses a purchased E27 cord set and LED bulb. Inspiration for separable serviceable printed parts, not copied geometry or fixed print settings.
- https://blog.prusa3d.com/let-there-be-light-enter-our-contest-to-win-a-new-original-prusa-i3-mk3s-printer_37744/ — printer manufacturer recommends LEDs over tungsten bulbs, emphasizes material/heat selection, printable part division and assembly.

Implementation: an original mushroom cap radius profile with adjustable brim, flare and roundness; a hollow circular stem with an integrated internal annular clamping deck; adjustable holder barrel diameter, radial allowance, ring outside diameter, deck thickness and mount depth; protected 5 mm top magnet rim with three 8.3 × 3.3 mm blind recesses; open underside for insulated holder/retaining-ring installation; open-bottom cable notch. No printed bulb thread, contacts, wiring terminals, or claimed strain relief.

Fit analysis uses conservative cylindrical holder and bulb envelopes against sampled inner profiles and both mounting passages. Target clearance is a user-entered geometric value, not a thermal rating. Hardware preview is illustrative, excluded from STL. Shade and base export separately as connected watertight solids. The open underside assumes a complete approved insulated cord-set assembly with its own strain relief. Bare electrical terminals require a professionally designed enclosure; this print alone is not one.

Normal printing, not spiral vase: clamping deck, annular cap bottom and protected pockets need slicer review and may need supports. Physical holder fit, ring engagement, stability, temperatures, and final electrical suitability remain unvalidated. No universal safe wattage is claimed.
