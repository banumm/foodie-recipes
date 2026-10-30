import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, ScrollView, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CATEGORIES, RECIPES } from './data';
import { useStore } from './store';

const ORANGE = '#e8590c';

function Heart({ id }) {
  const { state, dispatch } = useStore();
  const on = state.favs.includes(id);
  return (
    <TouchableOpacity onPress={() => dispatch({ type: 'TOGGLE_FAV', id })} accessibilityLabel="Избранное">
      <Text style={{ fontSize: 26 }}>{on ? '❤️' : '🤍'}</Text>
    </TouchableOpacity>
  );
}

function Thumb({ item, size = 64 }) {
  return item.image
    ? <Image source={{ uri: item.image }} style={{ width: size, height: size, borderRadius: 12 }} />
    : <View style={[s.thumb, { width: size, height: size }]}><Text style={{ fontSize: size / 2 }}>{item.emoji}</Text></View>;
}

function Card({ item, onPress }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress}>
      <Thumb item={item} />
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text style={s.title}>{item.title}</Text>
        <Text style={s.muted}>{item.category} · {item.time}</Text>
      </View>
      <Heart id={item.id} />
    </TouchableOpacity>
  );
}

export function HomeScreen({ navigation }) {
  const [cat, setCat] = useState('Все');
  const { state } = useStore();
  const all = [...RECIPES, ...state.mine];
  const list = cat === 'Все' ? all : all.filter((r) => r.category === cat);
  return (
    <View style={s.screen}>
      <Text style={s.h1}>Foodie 🍴</Text>
      <View style={{ height: 52 }}>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={CATEGORIES} keyExtractor={(c) => c}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setCat(item)} style={[s.chip, cat === item && s.chipOn]}>
              <Text style={[s.chipText, cat === item && { color: '#fff' }]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <FlatList
        data={list} keyExtractor={(r) => r.id}
        renderItem={({ item }) => <Card item={item} onPress={() => navigation.navigate('Detail', { id: item.id })} />}
        ListEmptyComponent={<Text style={s.muted}>В этой категории пока нет рецептов</Text>}
      />
    </View>
  );
}

export function FavoritesScreen({ navigation }) {
  const { state } = useStore();
  const list = [...RECIPES, ...state.mine].filter((r) => state.favs.includes(r.id));
  return (
    <View style={s.screen}>
      <Text style={s.h1}>Избранное</Text>
      <FlatList
        data={list} keyExtractor={(r) => r.id}
        renderItem={({ item }) => <Card item={item} onPress={() => navigation.navigate('Detail', { id: item.id })} />}
        ListEmptyComponent={<Text style={s.muted}>Нажмите 🤍 на рецепте, чтобы добавить его сюда</Text>}
      />
    </View>
  );
}

export function MyFoodScreen({ navigation }) {
  const { state } = useStore();
  return (
    <View style={s.screen}>
      <Text style={s.h1}>Моя еда</Text>
      <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Form', {})}>
        <Text style={s.btnText}>＋ Добавить новый рецепт</Text>
      </TouchableOpacity>
      <Text style={s.h2}>Мои рецепты</Text>
      <FlatList
        data={state.mine} keyExtractor={(r) => r.id}
        renderItem={({ item }) => <Card item={item} onPress={() => navigation.navigate('Detail', { id: item.id })} />}
        ListEmptyComponent={<Text style={s.muted}>У вас пока нет своих рецептов</Text>}
      />
    </View>
  );
}

export function DetailScreen({ route, navigation }) {
  const { state, dispatch } = useStore();
  const item = [...RECIPES, ...state.mine].find((r) => r.id === route.params.id);
  if (!item) return null;
  const mine = state.mine.some((m) => m.id === item.id);
  const del = () => Alert.alert('Удалить рецепт?', item.title, [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Удалить', style: 'destructive', onPress: () => { dispatch({ type: 'DELETE', id: item.id }); navigation.goBack(); } },
  ]);
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Назад</Text></TouchableOpacity>
      <View style={{ alignItems: 'center', marginVertical: 8 }}><Thumb item={item} size={160} /></View>
      <View style={s.row}><Text style={[s.h1, { flex: 1 }]}>{item.title}</Text><Heart id={item.id} /></View>
      <View style={s.info}>
        <Text style={s.infoTxt}>⏱ Время: {item.time}</Text>
        <Text style={s.infoTxt}>🍽 Порции: {item.servings}</Text>
        <Text style={s.infoTxt}>🔥 Калории: {item.calories}</Text>
        <Text style={s.infoTxt}>📊 Сложность: {item.difficulty}</Text>
      </View>
      <Text style={s.h2}>Ингредиенты</Text>
      {item.ingredients.map((x, i) => <Text key={i} style={s.line}>• {x}</Text>)}
      <Text style={s.h2}>Инструкции</Text>
      {item.instructions.map((x, i) => <Text key={i} style={s.line}>{i + 1}. {x}</Text>)}
      {mine && (
        <View style={[s.row, { marginTop: 20 }]}>
          <TouchableOpacity style={[s.btn, { flex: 1, marginRight: 8 }]} onPress={() => navigation.navigate('Form', { id: item.id })}>
            <Text style={s.btnText}>Редактировать</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: '#c92a2a' }]} onPress={del}>
            <Text style={s.btnText}>Удалить</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

export function FormScreen({ route, navigation }) {
  const { state, dispatch } = useStore();
  const old = state.mine.find((m) => m.id === route.params?.id);
  const [title, setTitle] = useState(old?.title || '');
  const [image, setImage] = useState(old?.image || null);
  const [ing, setIng] = useState(old?.ingredients.join('\n') || '');
  const [steps, setSteps] = useState(old?.instructions.join('\n') || '');

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (!res.canceled) setImage(res.assets[0].uri);
  };
  const lines = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean);
  const save = () => {
    if (!title.trim() || !lines(ing).length || !lines(steps).length)
      return Alert.alert('Заполните название, ингредиенты и инструкции');
    dispatch({ type: 'SAVE', recipe: {
      id: old?.id || String(Date.now()), title: title.trim(), image, emoji: '🍽️', category: 'Мои',
      ingredients: lines(ing), instructions: lines(steps),
      time: old?.time || 'Не указано', servings: old?.servings || 'Не указано',
      calories: old?.calories || 'Не указано', difficulty: old?.difficulty || 'Не указано',
    } });
    navigation.goBack();
  };
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Назад</Text></TouchableOpacity>
      <Text style={s.h1}>{old ? 'Редактировать рецепт' : 'Новый рецепт'}</Text>
      <Text style={s.h2}>Название рецепта</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Например, Борщ" />
      <Text style={s.h2}>Изображение</Text>
      {image && <Image source={{ uri: image }} style={s.preview} />}
      <TouchableOpacity style={[s.btn, { backgroundColor: '#495057' }]} onPress={pick}>
        <Text style={s.btnText}>{image ? 'Изменить изображение' : 'Загрузить изображение'}</Text>
      </TouchableOpacity>
      <Text style={s.h2}>Список ингредиентов (по одному в строке)</Text>
      <TextInput style={[s.input, s.multi]} value={ing} onChangeText={setIng} multiline />
      <Text style={s.h2}>Пошаговые инструкции (один шаг в строке)</Text>
      <TextInput style={[s.input, s.multi]} value={steps} onChangeText={setSteps} multiline />
      <TouchableOpacity style={[s.btn, { marginTop: 20 }]} onPress={save}>
        <Text style={s.btnText}>Сохранить рецепт</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff8f0', padding: 16 },
  h1: { fontSize: 26, fontWeight: '800', color: '#3b2a1a', marginTop: 8, marginBottom: 8 },
  h2: { fontSize: 17, fontWeight: '700', color: '#3b2a1a', marginTop: 16, marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '700', color: '#3b2a1a' },
  muted: { color: '#868e96', marginTop: 4 },
  line: { fontSize: 15, color: '#343a40', marginVertical: 3 },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 10, marginVertical: 5, elevation: 2 },
  thumb: { backgroundColor: '#ffe8cc', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 16, height: 38, borderRadius: 19, backgroundColor: '#ffe8cc', justifyContent: 'center', marginRight: 8 },
  chipOn: { backgroundColor: ORANGE },
  chipText: { color: '#5c3d1e', fontWeight: '600' },
  btn: { backgroundColor: ORANGE, padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  info: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 8 },
  infoTxt: { fontSize: 15, marginVertical: 2, color: '#343a40' },
  back: { color: ORANGE, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#dee2e6' },
  multi: { minHeight: 110, textAlignVertical: 'top' },
  preview: { width: '100%', height: 180, borderRadius: 12, marginBottom: 8 },
});
