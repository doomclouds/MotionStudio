import renderer from './render.cjs';
export const config={width:960,height:540,fps:1,duration:1};
export function createScene({ctx}) {return {render(){renderer.draw(ctx)}};}
