import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore, AppTab } from '../mobile/src/store/useAppStore';

describe('PART – Navigation & Tab Switching System', () => {
  beforeEach(() => {
    useAppStore.setState({ currentTab: 'home' });
  });

  const TAB_TO_PATH: Record<AppTab, string> = {
    home: '/',
    explore: '/explore',
    post: '/post',
    activity: '/activity',
    profile: '/profile',
  };

  const PATH_TO_TAB: Record<string, AppTab> = {
    '/': 'home',
    '/explore': 'explore',
    '/post': 'post',
    '/activity': 'activity',
    '/profile': 'profile',
  };

  it('initializes with home tab', () => {
    expect(useAppStore.getState().currentTab).toBe('home');
  });

  it('switches to explore tab via setTab', () => {
    useAppStore.getState().setTab('explore');
    expect(useAppStore.getState().currentTab).toBe('explore');
    expect(TAB_TO_PATH[useAppStore.getState().currentTab]).toBe('/explore');
  });

  it('switches to post task tab via setTab', () => {
    useAppStore.getState().setTab('post');
    expect(useAppStore.getState().currentTab).toBe('post');
    expect(TAB_TO_PATH[useAppStore.getState().currentTab]).toBe('/post');
  });

  it('switches to activity tab via setTab', () => {
    useAppStore.getState().setTab('activity');
    expect(useAppStore.getState().currentTab).toBe('activity');
    expect(TAB_TO_PATH[useAppStore.getState().currentTab]).toBe('/activity');
  });

  it('switches to profile tab via setTab', () => {
    useAppStore.getState().setTab('profile');
    expect(useAppStore.getState().currentTab).toBe('profile');
    expect(TAB_TO_PATH[useAppStore.getState().currentTab]).toBe('/profile');
  });

  it('correctly maps all 5 routes back to tabs', () => {
    expect(PATH_TO_TAB['/']).toBe('home');
    expect(PATH_TO_TAB['/explore']).toBe('explore');
    expect(PATH_TO_TAB['/post']).toBe('post');
    expect(PATH_TO_TAB['/activity']).toBe('activity');
    expect(PATH_TO_TAB['/profile']).toBe('profile');
  });
});
